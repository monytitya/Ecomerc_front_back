package Spring_Ecomerc.Spring_ecomerc.service;

import Spring_Ecomerc.Spring_ecomerc.dto.PlaceOrderRequest;
import Spring_Ecomerc.Spring_ecomerc.entity.CustomerOrder;
import Spring_Ecomerc.Spring_ecomerc.entity.PendingOrder;
import Spring_Ecomerc.Spring_ecomerc.model.OrderModel;
import Spring_Ecomerc.Spring_ecomerc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final PendingOrderRepository pendingOrderRepository;
    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final TelegramService telegramService;

    @Transactional
    public OrderModel placeOrder(PlaceOrderRequest request, String ipAddress) {
        long invoiceNo = Math.abs(new Random().nextLong() % 2_000_000_000L);
        // If provided customerId does not exist in DB, treat as guest order (avoid FK violation)
        Integer customerId = request.getCustomerId();
        if (customerId != null && !customerRepository.existsById(customerId)) {
            customerId = null;
        }

        CustomerOrder order = CustomerOrder.builder()
                .customerId(customerId)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerAddress(request.getCustomerAddress())
                .dueAmount(request.getDueAmount())
                .invoiceNo(invoiceNo)
                .qty(request.getQty())
                .size(request.getSize())
                .orderDate(LocalDateTime.now())
                .orderStatus("pending")
                .build();
        customerOrderRepository.save(order);

        PendingOrder pendingOrder = PendingOrder.builder()
                .customerId(customerId)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerAddress(request.getCustomerAddress())
                .invoiceNo(invoiceNo)
                .productId(request.getProductId())
                .qty(request.getQty())
                .size(request.getSize())
                .orderStatus("pending")
                .build();
        pendingOrderRepository.save(pendingOrder);

        // New Idea: Instant Telegram Alert
        try {
            String customerName = customerId == null
                    ? "Guest"
                    : customerRepository.findById(customerId)
                            .map(c -> c.getCustomerName())
                            .orElse("Guest");
            String productTitle = productRepository.findById(request.getProductId())
                    .map(p -> p.getProductTitle()).orElse("Product #" + request.getProductId());

            String msg = "<b>📦 New Order Received!</b>\n\n" +
                         "<b>Invoice:</b> #" + invoiceNo + "\n" +
                         "<b>Customer:</b> " + customerName + "\n" +
                         "<b>Product:</b> " + productTitle + "\n" +
                         "<b>Quantity:</b> " + request.getQty() + "\n" +
                         "<b>Total:</b> $" + String.format("%.2f", request.getDueAmount()) + "\n\n" +
                         "<i>Please check the admin dashboard to process.</i>";
            telegramService.sendMessage(msg);
        } catch (Exception e) {
            // Don't fail the order if telegram fails
        }

        return mapToModel(order);
    }

    public List<OrderModel> getOrdersByCustomer(Integer customerId) {
        return customerOrderRepository.findByCustomerId(customerId).stream().map(this::mapToModel)
                .collect(Collectors.toList());
    }

    public OrderModel getOrderByInvoiceNo(Long invoiceNo) {
        return customerOrderRepository.findByInvoiceNo(invoiceNo)
                .map(this::mapToModel)
                .orElseThrow(() -> new RuntimeException("Order not found with invoice no: " + invoiceNo));
    }

    public List<OrderModel> getAllOrders() {
        return customerOrderRepository.findAll().stream().map(this::mapToModel).collect(Collectors.toList());
    }

    public OrderModel updateOrderStatus(Integer orderId, String status) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setOrderStatus(status);
        return mapToModel(customerOrderRepository.save(order));
    }

    private OrderModel mapToModel(CustomerOrder order) {
        OrderModel model = new OrderModel();
        model.setOrderId(order.getOrderId());
        model.setCustomerId(order.getCustomerId());
        model.setCustomerName(order.getCustomerName());
        model.setCustomerPhone(order.getCustomerPhone());
        model.setCustomerAddress(order.getCustomerAddress());
        model.setDueAmount(order.getDueAmount());
        model.setInvoiceNo(order.getInvoiceNo());
        model.setQty(order.getQty());
        model.setSize(order.getSize());
        model.setOrderDate(order.getOrderDate());
        model.setOrderStatus(order.getOrderStatus());

        if (order.getCustomer() != null && (model.getCustomerName() == null || model.getCustomerName().isBlank())) {
            model.setCustomerName(order.getCustomer().getCustomerName());
        } else if (order.getCustomerId() != null) {
            customerRepository.findById(order.getCustomerId()).ifPresentOrElse(
                    c -> model.setCustomerName(c.getCustomerName()),
                    () -> model.setCustomerName("Unknown Customer (ID: " + order.getCustomerId() + ")"));
        } else {
            model.setCustomerName("Guest User");
        }
        pendingOrderRepository.findByInvoiceNo(order.getInvoiceNo()).stream().findFirst().ifPresent(po -> {
            model.setProductId(po.getProductId());
            if (po.getProduct() != null) {
                model.setProductTitle(po.getProduct().getProductTitle());
            } else if (po.getProductId() != null) {
                productRepository.findById(po.getProductId()).ifPresentOrElse(
                        p -> model.setProductTitle(p.getProductTitle()),
                        () -> model.setProductTitle("Unknown Product (ID: " + po.getProductId() + ")"));
            } else {
                model.setProductTitle("Unknown Product");
            }
        });

        return model;
    }
}
