import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // Required by next-swagger-doc to build spec structure
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Solutech E-Commerce API",
        version: "1.0.0",
        description: "Interactive Swagger API documentation for the Solutech Backend Technical Test REST API.",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token (obtained from POST /api/auth/login) in the format: <token_value>",
          },
        },
      },
      paths: {
        "/api/auth/login": {
          post: {
            tags: ["Auth"],
            summary: "Authenticate user and get JWT token",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                      email: {
                        type: "string",
                        format: "email",
                        example: "admin@solutech.id",
                      },
                      password: {
                        type: "string",
                        format: "password",
                        example: "password123",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Login successful",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "object",
                          properties: {
                            token: { type: "string" },
                            user: {
                              type: "object",
                              properties: {
                                id: { type: "string", format: "uuid" },
                                email: { type: "string" },
                                role: { type: "string", example: "ADMIN" },
                                createdAt: { type: "string", format: "date-time" },
                                updatedAt: { type: "string", format: "date-time" },
                              },
                            },
                          },
                        },
                        message: { type: "string", example: "Login successful" },
                      },
                    },
                  },
                },
              },
              400: {
                description: "Validation failed",
              },
              401: {
                description: "Invalid or incorrect credentials",
              },
            },
          },
        },
        "/api/products": {
          get: {
            tags: ["Products"],
            summary: "Get a list of active products (cached in Redis)",
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "integer", default: 1 },
                description: "Page offset number",
              },
              {
                name: "limit",
                in: "query",
                schema: { type: "integer", default: 10 },
                description: "Maximum items per page",
              },
              {
                name: "search",
                in: "query",
                schema: { type: "string" },
                description: "Case-insensitive query search against product names",
              },
              {
                name: "minPrice",
                in: "query",
                schema: { type: "integer" },
                description: "Minimum product price filter",
              },
              {
                name: "maxPrice",
                in: "query",
                schema: { type: "integer" },
                description: "Maximum product price filter",
              },
              {
                name: "sortBy",
                in: "query",
                schema: { type: "string", enum: ["price", "createdAt", "stock", "name"], default: "createdAt" },
                description: "Sort fields criteria",
              },
              {
                name: "sortOrder",
                in: "query",
                schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
                description: "Sorting orientation order",
              },
            ],
            responses: {
              200: {
                description: "List of products",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              name: { type: "string" },
                              description: { type: "string" },
                              price: { type: "integer" },
                              stock: { type: "integer" },
                              createdAt: { type: "string", format: "date-time" },
                              updatedAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                        pagination: {
                          type: "object",
                          properties: {
                            total: { type: "integer" },
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            totalPages: { type: "integer" },
                            hasNextPage: { type: "boolean" },
                          },
                        },
                        message: { type: "string", example: "Products fetched successfully" },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ["Products"],
            summary: "Create a new product (Admin only)",
            security: [{ BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["name", "price", "stock"],
                    properties: {
                      name: { type: "string", example: "Wireless Gaming Mouse" },
                      description: { type: "string", example: "High performance RGB wireless mouse" },
                      price: { type: "integer", example: 500000 },
                      stock: { type: "integer", example: 50 },
                    },
                  },
                },
              },
            },
            responses: {
              201: {
                description: "Product created successfully",
              },
              400: {
                description: "Validation failed",
              },
              401: {
                description: "Unauthorized",
              },
            },
          },
        },
        "/api/products/{id}": {
          get: {
            tags: ["Products"],
            summary: "Get a product by ID",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            responses: {
              200: {
                description: "Product details",
              },
              400: {
                description: "Invalid UUID format",
              },
              404: {
                description: "Product not found",
              },
            },
          },
          put: {
            tags: ["Products"],
            summary: "Update an existing product (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      price: { type: "integer" },
                      stock: { type: "integer" },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Product updated successfully",
              },
              400: {
                description: "Validation or format failed",
              },
              401: {
                description: "Unauthorized",
              },
              404: {
                description: "Product not found",
              },
            },
          },
          delete: {
            tags: ["Products"],
            summary: "Soft-delete a product (Admin only)",
            security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            responses: {
              200: {
                description: "Product deleted successfully",
              },
              400: {
                description: "Invalid UUID format",
              },
              401: {
                description: "Unauthorized",
              },
              404: {
                description: "Product not found",
              },
            },
          },
        },
        "/api/orders": {
          get: {
            tags: ["Orders"],
            summary: "Get order history for authenticated user (Admins get all with pagination & filters)",
            security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: "page",
                in: "query",
                schema: { type: "integer", default: 1 },
                description: "Page index (Admin only)",
              },
              {
                name: "limit",
                in: "query",
                schema: { type: "integer", default: 10 },
                description: "Orders limit count (Admin only)",
              },
              {
                name: "search",
                in: "query",
                schema: { type: "string" },
                description: "Filter by user email (Admin only)",
              },
              {
                name: "status",
                in: "query",
                schema: { type: "string", enum: ["PENDING", "VERIFIED", "COMPLETED", "CANCELLED"] },
                description: "Filter by order status (Admin only)",
              },
              {
                name: "minAmount",
                in: "query",
                schema: { type: "integer" },
                description: "Minimum order amount filter (Admin only)",
              },
              {
                name: "maxAmount",
                in: "query",
                schema: { type: "integer" },
                description: "Maximum order amount filter (Admin only)",
              },
              {
                name: "sortBy",
                in: "query",
                schema: { type: "string", enum: ["totalAmount", "createdAt"], default: "createdAt" },
                description: "Sort fields criteria (Admin only)",
              },
              {
                name: "sortOrder",
                in: "query",
                schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
                description: "Sort orientation (Admin only)",
              },
            ],
            responses: {
              200: {
                description: "User order list or paginated Admin list",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              userId: { type: "string", format: "uuid" },
                              totalAmount: { type: "integer" },
                              status: { type: "string" },
                              verifiedById: { type: "string", format: "uuid", nullable: true },
                              createdAt: { type: "string", format: "date-time" },
                              updatedAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                        pagination: {
                          type: "object",
                          properties: {
                            total: { type: "integer" },
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            totalPages: { type: "integer" },
                            hasNextPage: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              401: {
                description: "Unauthorized",
              },
            },
          },
          post: {
            tags: ["Orders"],
            summary: "Place a new order (Interactive Transaction)",
            security: [{ BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["items"],
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["productId", "quantity"],
                          properties: {
                            productId: { type: "string", format: "uuid", example: "baa425b0-a2ac-456a-9aa9-453f8727b69a" },
                            quantity: { type: "integer", example: 2 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              201: {
                description: "Order created successfully",
              },
              400: {
                description: "Validation error or insufficient inventory stock",
              },
              401: {
                description: "Unauthorized",
              },
            },
          },
        },
        "/api/orders/{id}": {
          get: {
            tags: ["Orders"],
            summary: "Get detailed order information by ID",
            security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            responses: {
              200: {
                description: "Order details",
              },
              401: {
                description: "Unauthorized",
              },
              404: {
                description: "Order not found",
              },
            },
          },
          put: {
            tags: ["Orders"],
            summary: "Update order status (e.g. COMPLETED, CANCELLED)",
            security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status"],
                    properties: {
                      status: {
                        type: "string",
                        enum: ["PENDING", "VERIFIED", "COMPLETED", "CANCELLED"],
                        example: "COMPLETED",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Order status updated successfully",
              },
              400: {
                description: "Invalid order status",
              },
              401: {
                description: "Unauthorized",
              },
              404: {
                description: "Order not found",
              },
            },
          },
          delete: {
            tags: ["Orders"],
            summary: "Delete an order and restock items",
            security: [{ BearerAuth: [] }],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            responses: {
              200: {
                description: "Order deleted successfully",
              },
              401: {
                description: "Unauthorized",
              },
              404: {
                description: "Order not found",
              },
            },
          },
        },
      },
    },
  });
  return spec;
};
