package Spring_Ecomerc.Spring_ecomerc.service;

import Spring_Ecomerc.Spring_ecomerc.entity.Product;
import Spring_Ecomerc.Spring_ecomerc.entity.Category;
import Spring_Ecomerc.Spring_ecomerc.entity.Manufacturer;
import Spring_Ecomerc.Spring_ecomerc.entity.ProductCategory;
import Spring_Ecomerc.Spring_ecomerc.model.ProductModel;
import Spring_Ecomerc.Spring_ecomerc.repository.BundleProductRelationRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.CartRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.CategoryRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.CouponRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.ManufacturerRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.ProductCategoryRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.ProductRepository;
import Spring_Ecomerc.Spring_ecomerc.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ManufacturerRepository manufacturerRepository;
    private final CouponRepository couponRepository;
    private final WishlistRepository wishlistRepository;
    private final CartRepository cartRepository;
    private final BundleProductRelationRepository bundleProductRelationRepository;
    private final FileService fileService;
    private final EntityManager entityManager;


    public Page<ProductModel> getAllProducts(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<Product> productPage = productRepository.findAll(pageable);
        return new PageImpl<>(mapToModels(productPage.getContent()), pageable, productPage.getTotalElements());
    }

    public ProductModel getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return mapToModel(product);
    }

    public List<ProductModel> getProductsByCategory(Integer catId) {
        return mapToModels(productRepository.findByCatId(catId));
    }

    public List<ProductModel> getProductsBySubCategory(Integer pCatId) {
        return mapToModels(productRepository.findByPCatId(pCatId));
    }

    public List<ProductModel> getProductsByManufacturer(Integer manufacturerId) {
        return mapToModels(productRepository.findByManufacturerId(manufacturerId));
    }

    public List<ProductModel> getFeaturedProducts() {
        return mapToModels(productRepository.findByProductLabel("Featured"));
    }

    public List<ProductModel> getProductsByLabel(String label) {
        return mapToModels(productRepository.findByProductLabel(label));
    }

    public List<ProductModel> searchProducts(String keyword) {
        return mapToModels(productRepository.findByProductTitleContainingIgnoreCase(keyword));
    }

    public ProductModel createProduct(Product product, MultipartFile img) throws IOException {
        validateProduct(product);
        product.setProductId(null);
        product.setDate(LocalDateTime.now());
        if (img != null && !img.isEmpty()) product.setProductImg(fileService.uploadFile(img, "products"));
        return mapToModel(productRepository.save(product));
    }

    public ProductModel createProductBase64(Product product, String img) throws IOException {
        validateProduct(product);
        product.setProductId(null);
        product.setDate(LocalDateTime.now());
        if (img != null && !img.isEmpty()) product.setProductImg(fileService.uploadBase64(img, "products"));
        return mapToModel(productRepository.save(product));
    }


    public ProductModel updateProduct(Integer id, Product updatedProduct, MultipartFile img) throws IOException {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        copyProperties(updatedProduct, existing);
        validateProduct(existing);
        
        if (img != null && !img.isEmpty()) existing.setProductImg(fileService.uploadFile(img, "products"));
        
        return mapToModel(productRepository.save(existing));
    }

    public ProductModel updateProductBase64(Integer id, Product updatedProduct, String img) throws IOException {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        copyProperties(updatedProduct, existing);
        validateProduct(existing);
        
        if (img != null && !img.isEmpty()) existing.setProductImg(fileService.uploadBase64(img, "products"));
        
        return mapToModel(productRepository.save(existing));
    }


    private void copyProperties(Product from, Product to) {
        if (from.getProductTitle() != null) to.setProductTitle(from.getProductTitle());
        if (from.getProductUrl() != null) to.setProductUrl(from.getProductUrl());
        if (from.getProductPrice() != null) to.setProductPrice(from.getProductPrice());
        if (from.getProductPspPrice() != null) to.setProductPspPrice(from.getProductPspPrice());
        if (from.getProductDesc() != null) to.setProductDesc(from.getProductDesc());
        if (from.getProductFeatures() != null) to.setProductFeatures(from.getProductFeatures());
        if (from.getProductVideo() != null) to.setProductVideo(from.getProductVideo());
        if (from.getProductLabel() != null) to.setProductLabel(from.getProductLabel());
        if (from.getProductKeywords() != null) to.setProductKeywords(from.getProductKeywords());
        if (from.getCatId() != null) to.setCatId(from.getCatId());
        if (from.getPCatId() != null) to.setPCatId(from.getPCatId());
        if (from.getManufacturerId() != null) to.setManufacturerId(from.getManufacturerId());
        if (from.getStatus() != null) to.setStatus(from.getStatus());
        to.setDate(LocalDateTime.now());
    }

    private ProductModel mapToModel(Product product) {
        return mapToModels(List.of(product)).get(0);
    }

    private List<ProductModel> mapToModels(List<Product> products) {
        Set<Integer> categoryIds = products.stream().map(Product::getCatId)
                .filter(java.util.Objects::nonNull).collect(Collectors.toSet());
        Set<Integer> productCategoryIds = products.stream().map(Product::getPCatId)
                .filter(java.util.Objects::nonNull).collect(Collectors.toSet());
        Set<Integer> manufacturerIds = products.stream().map(Product::getManufacturerId)
                .filter(java.util.Objects::nonNull).collect(Collectors.toSet());

        Map<Integer, Category> categories = new HashMap<>();
        categoryRepository.findAllById(categoryIds).forEach(category -> categories.put(category.getCatId(), category));
        Map<Integer, ProductCategory> productCategories = new HashMap<>();
        productCategoryRepository.findAllById(productCategoryIds)
                .forEach(category -> productCategories.put(category.getPCatId(), category));
        Map<Integer, Manufacturer> manufacturers = new HashMap<>();
        manufacturerRepository.findAllById(manufacturerIds)
                .forEach(manufacturer -> manufacturers.put(manufacturer.getManufacturerId(), manufacturer));

        List<ProductModel> models = new ArrayList<>(products.size());
        for (Product product : products) {
            models.add(mapToModel(product, categories, productCategories, manufacturers));
        }
        return models;
    }

    private ProductModel mapToModel(
            Product product,
            Map<Integer, Category> categories,
            Map<Integer, ProductCategory> productCategories,
            Map<Integer, Manufacturer> manufacturers) {
        ProductModel model = new ProductModel();
        model.setProductId(product.getProductId());
        model.setProductTitle(product.getProductTitle());
        model.setProductUrl(product.getProductUrl());
        model.setProductImg(product.getProductImg());

        model.setProductPrice(product.getProductPrice());
        model.setProductPspPrice(product.getProductPspPrice());
        model.setProductDesc(product.getProductDesc());
        model.setProductFeatures(product.getProductFeatures());
        model.setProductVideo(product.getProductVideo());
        model.setProductKeywords(product.getProductKeywords());
        model.setProductLabel(product.getProductLabel());
        model.setStatus(product.getStatus());
        
        model.setCatId(product.getCatId());
        var category = categories.get(product.getCatId());
        if (category != null) model.setCatTitle(category.getCatTitle());
        
        model.setPCatId(product.getPCatId());
        var productCategory = productCategories.get(product.getPCatId());
        if (productCategory != null) model.setPCatTitle(productCategory.getPCatTitle());
        
        model.setManufacturerId(product.getManufacturerId());
        var manufacturer = manufacturers.get(product.getManufacturerId());
        if (manufacturer != null) model.setManufacturerTitle(manufacturer.getManufacturerTitle());
        
        model.setDate(product.getDate());
        
        return model;
    }

    private void validateProduct(Product product) {
        if (product.getProductTitle() == null || product.getProductTitle().isBlank()) {
            throw new IllegalArgumentException("Product title is required");
        }
        if (product.getProductPrice() == null || !Double.isFinite(product.getProductPrice())
                || product.getProductPrice() <= 0) {
            throw new IllegalArgumentException("Product price must be greater than 0");
        }
        if (product.getProductPspPrice() != null && (!Double.isFinite(product.getProductPspPrice())
                || product.getProductPspPrice() < 0)) {
            throw new IllegalArgumentException("PSP price cannot be negative");
        }
    }

    @Transactional
    public void deleteProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        couponRepository.deleteByProductId(product.getProductId());
        wishlistRepository.deleteByProductId(product.getProductId());
        cartRepository.deleteByProductId(product.getProductId());
        bundleProductRelationRepository.deleteByProductId(product.getProductId());
        entityManager.flush();
        entityManager.createNativeQuery(
                "delete from pending_orders where cast(product_id as text) = cast(:productId as text)")
            .setParameter("productId", product.getProductId())
            .executeUpdate();
        entityManager.flush();

        productRepository.deleteById(product.getProductId());
        entityManager.flush();
    }
}
