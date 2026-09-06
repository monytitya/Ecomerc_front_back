package Spring_Ecomerc.Spring_ecomerc.service;

import Spring_Ecomerc.Spring_ecomerc.dto.BakongWebhookRequest;
import Spring_Ecomerc.Spring_ecomerc.dto.PaymentCreateRequest;
import Spring_Ecomerc.Spring_ecomerc.dto.PaymentResponse;
import Spring_Ecomerc.Spring_ecomerc.entity.CustomerOrder;
import Spring_Ecomerc.Spring_ecomerc.entity.Payment;
import Spring_Ecomerc.Spring_ecomerc.entity.PaymentStatus;
import Spring_Ecomerc.Spring_ecomerc.repository.CustomerOrderRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.PaymentRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.PendingOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final TelegramService telegramService;
    private final KHQRService khqrService;
    private final CustomerOrderRepository customerOrderRepository;
    private final PendingOrderRepository pendingOrderRepository;

    // Payment amount constants
    private static final Double MIN_PAYMENT_AMOUNT_USD = 0.01;
    private static final Integer MIN_PAYMENT_AMOUNT_KHR = 100;

    public static boolean validateMinimumPaymentAmount(Double amount, String currency) {
        if (amount == null) {
            return false;
        }

        String normalizedCurrency = currency == null ? "" : currency.trim().toUpperCase(Locale.ROOT);

        if ("KHR".equals(normalizedCurrency)) {
            return amount >= MIN_PAYMENT_AMOUNT_KHR;
        }

        return amount >= MIN_PAYMENT_AMOUNT_USD;
    }

    @Value("${payment.khqr.merchant-id}")
    private String merchantId;

    @Value("${payment.khqr.merchant-name}")
    private String merchantName;

    @Value("${payment.khqr.merchant-city}")
    private String merchantCity;

    @Value("${khqr.api.token:}")
    private String bakongToken;

    @Override
    @Transactional
    public PaymentResponse createPayment(PaymentCreateRequest request) {
        // Validate orderId
        if (request.getOrderId() == null || request.getOrderId() <= 0) {
            throw new RuntimeException("Invalid order ID. Order ID must be a positive number.");
        }

        CustomerOrder order = customerOrderRepository.findById(request.getOrderId().intValue())
                .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));

        if (order.getDueAmount() == null || request.getAmount() == null
                || Math.abs(order.getDueAmount() - request.getAmount()) > 0.001) {
            throw new RuntimeException("Payment amount does not match order total for order #" + request.getOrderId());
        }
        
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new RuntimeException(
                "Invalid payment amount: " + request.getAmount() + 
                ". Amount must be greater than 0 for order #" + request.getOrderId() + 
                ". Please ensure the order has a valid total amount."
            );
        }
        
        String paymentCurrency = request.getCurrency() == null ? "USD" : request.getCurrency().trim().toUpperCase(Locale.ROOT);
        if (!validateMinimumPaymentAmount(request.getAmount(), paymentCurrency)) {
            String minMessage = "KHR".equals(paymentCurrency)
                ? MIN_PAYMENT_AMOUNT_KHR + " Riel"
                : "$" + String.format(Locale.ROOT, "%.2f", MIN_PAYMENT_AMOUNT_USD) + " USD";

            throw new RuntimeException(
                "Payment amount too low: " + String.format(Locale.ROOT, "%.2f", request.getAmount()) +
                " " + paymentCurrency + ". Minimum payment amount is " + minMessage + ". Order #" + request.getOrderId()
            );
        }
        
        if (!isConfiguredBakongAccount(merchantId)) {
            throw new IllegalStateException(
                    "KHQR receiving account is not configured. Set KHQR_MERCHANT_ID to an active Bakong account ID, for example store@bank.");
        }

        // Check for existing pending payment for this order
        return paymentRepository.findByOrderId(request.getOrderId()).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .findFirst()
                .map(this::getPaymentResponseWithQR)
                .orElseGet(() -> {
                    String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    
                    Payment payment = Payment.builder()
                            .orderId(request.getOrderId())
                            .transactionId(transactionId)
                            .amount(request.getAmount())
                            .currency(request.getCurrency())
                            .status(PaymentStatus.PENDING)
                            .createdAt(LocalDateTime.now())
                            .build();

                    payment = paymentRepository.save(payment);
                    return getPaymentResponseWithQR(payment);
                });
    }

    @Override
    @Transactional
    public PaymentResponse getPaymentStatus(String transactionId) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Payment not found with transaction ID: " + transactionId));

        if (payment.getStatus() == PaymentStatus.PENDING) {
            checkPaymentWithBakong(payment);
        }
        
        return getPaymentResponseWithQR(payment);
    }

    private PaymentResponse getPaymentResponseWithQR(Payment payment) {
        PaymentResponse response = mapToResponse(payment);
        if (payment.getStatus() == PaymentStatus.PENDING) {
            try {
                if (payment.getKhqrPayload() == null || payment.getQrExpiresAt() == null
                        || !payment.getQrExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
                    String qrString = khqrService.generateKHQRString(
                            merchantId,
                            merchantName,
                            merchantCity,
                            String.format(Locale.ROOT, "%.2f", payment.getAmount()),
                            payment.getCurrency(),
                            String.valueOf(payment.getOrderId())
                    );

                    byte[] md5Bytes = java.security.MessageDigest.getInstance("MD5")
                            .digest(qrString.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    payment.setKhqrPayload(qrString);
                    payment.setMd5(java.util.HexFormat.of().formatHex(md5Bytes));
                    payment.setQrExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10));
                    paymentRepository.save(payment);
                }

                response.setQrString(payment.getKhqrPayload());
                response.setQrImage(khqrService.generateQRCodeBase64(payment.getKhqrPayload()));
            } catch (Exception e) {
                System.err.println("Error generating KHQR: " + e.getMessage());
                e.printStackTrace();
                // Log error but don't fail - return response without QR
            }
        }
        return response;
    }

    @Override
    @Transactional
    public PaymentResponse processWebhook(BakongWebhookRequest request) {
        if (request.getTransactionId() == null || request.getTransactionId().isEmpty()) {
            System.err.println("Invalid webhook request: missing transaction ID");
            throw new RuntimeException("Transaction ID is required");
        }
        
        Payment payment = paymentRepository.findByTransactionId(request.getTransactionId())
                .orElseThrow(() -> {
                    System.err.println("Transaction not found: " + request.getTransactionId());
                    return new RuntimeException("Transaction not found: " + request.getTransactionId());
                });

            if (request.getAmount() != null && payment.getAmount() != null
                && Math.abs(payment.getAmount() - request.getAmount()) > 0.001) {
                throw new RuntimeException("Webhook amount does not match payment amount");
            }

        markAsPaid(payment, "Bakong KHQR");

        return mapToResponse(payment);
    }

    @Override
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PaymentResponse mapToResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .orderId(p.getOrderId())
                .transactionId(p.getTransactionId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private boolean isConfiguredBakongAccount(String accountId) {
        if (accountId == null || accountId.isBlank()) {
            return false;
        }

        String normalized = accountId.trim().toLowerCase(Locale.ROOT);
        return normalized.matches("^[^@\\s]{1,32}@[a-z0-9][a-z0-9-]{1,31}$")
                && !normalized.startsWith("dev_")
                && !normalized.contains("example")
                && !normalized.contains("dummy");
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000)
    public void checkPaymentStatusFromBakong() {
        java.util.List<Payment> pendingPayments = paymentRepository.findByStatus(PaymentStatus.PENDING).stream()
                .filter(p -> p.getMd5() != null && !p.getMd5().isEmpty())
                .collect(Collectors.toList());

        for (Payment payment : pendingPayments) {
            checkPaymentWithBakong(payment);
        }
    }

    private void checkPaymentWithBakong(Payment payment) {
        if (bakongToken == null || bakongToken.isBlank()) {
            return;
        }

        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(bakongToken.trim());
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            java.util.Map<String, String> body = java.util.Map.of("md5", payment.getMd5());
            org.springframework.http.HttpEntity<java.util.Map<String, String>> request = new org.springframework.http.HttpEntity<>(body, headers);
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(
                    "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", request, java.util.Map.class);

            Object responseCode = response.getBody() == null ? null : response.getBody().get("responseCode");
            if (responseCode != null && Integer.parseInt(responseCode.toString()) == 0) {
                markAsPaid(payment, "Bakong API");
            }
        } catch (Exception e) {
            System.err.println("Bakong status check failed for payment " + payment.getTransactionId() + ": " + e.getMessage());
        }
    }

    private void markAsPaid(Payment payment, String paymentSource) {
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return;
        }

        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);
        customerOrderRepository.findById(payment.getOrderId().intValue()).ifPresent(order -> {
            order.setOrderStatus("Paid");
            customerOrderRepository.save(order);
            pendingOrderRepository.findByInvoiceNo(order.getInvoiceNo()).forEach(po -> {
                po.setOrderStatus("Paid");
                pendingOrderRepository.save(po);
            });
        });
        telegramService.sendPaymentNotification(String.valueOf(payment.getOrderId()), payment.getAmount(), paymentSource);
    }
}
