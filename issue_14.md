# Issue #14: Product Image Uploads & S3 Integration

## Context
To improve our product catalog, we are introducing image support for products. We will utilize AWS S3 (Free Tier) to store these images securely and efficiently.

## Objective
As a Junior Frontend and Junior Backend Developer pair, your objective is to implement a robust image upload and retrieval system using AWS S3 and Next.js best practices, incorporating Redis for performance optimization.

## Requirements

### 1. Image Upload Constraints & Storage (Backend)
- **Feature:** Implement an API to handle product image uploads.
- **Constraints:** A product can have a maximum of **10 images**. Each image must not exceed **5MB**.
- **Storage:** Upload images to an AWS S3 bucket. Ensure you are using temporary/presigned URLs for secure uploads and downloads (AWS S3 best practices).

### 2. Next.js S3 & Redis Best Practices (Backend)
- **Feature:** Implement efficient image retrieval.
- **Caching:** Instead of generating a new presigned URL from AWS on every single request, use **Redis** to cache these temporary URLs until they expire. This reduces AWS API calls and adheres to Next.js + S3 best practices.

### 3. Product Catalog UI (Frontend)
- **Feature:** Update the product forms and views to support image management.
- **Implementation:** 
  - **Create & Edit:** Add an image upload component to the product creation and editing forms. Ensure frontend validation (max 10 images, max 5MB per image).
  - **Detail View:** Display the uploaded product images in the Product Catalog detail page.

### 4. Order Item Details (Frontend)
- **Feature:** Provide granular visibility into ordered items.
- **Implementation:** In the Order Details page, add a **"Detail Order Item"** button/action for each item in the order. Clicking this should display the specific details of that item, including its associated product image retrieved via the cached S3 temporary URL.

### 5. Branch & Process Guidelines
- Create a new branch for this feature.
- Update the Swagger API documentation and Postman Collection to reflect the new image upload and retrieval endpoints.
- Ensure all new features have appropriate unit tests.
- Please test everything locally before submitting a Pull Request.

## Acceptance Criteria
- [x] Product images can be successfully uploaded and stored in AWS S3.
- [x] Backend enforces constraints: Max 10 images per product, max 5MB per image.
- [x] Temporary/presigned URLs are used for all S3 interactions and are properly cached in Redis.
- [x] Product creation, editing, and detail pages support image display and management.
- [x] Order Details page includes a "Detail Order Item" view that displays the product image.
- [x] API documentation and tests are updated and passing.
