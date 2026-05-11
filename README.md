ai-rigs-backend/
│
├── src/main/java/com/airigs/
│   │
│   ├── AiRigsApplication.java          ← main entry point
│   │
│   ├── common/                         ← shared across all modules, no business logic
│   │   ├── config/
│   │   │   ├── JpaConfig.java
│   │   │   ├── SecurityConfig.java
│   │   │   ├── WebConfig.java          ← CORS, interceptors
│   │   │   └── SchedulerConfig.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   ├── ResourceNotFoundException.java
│   │   │   └── ValidationException.java
│   │   ├── response/
│   │   │   ├── ApiResponse.java        ← standard wrapper { data, message, status }
│   │   │   └── PagedResponse.java
│   │   └── util/
│   │       ├── ParseUtil.java          ← shared parsing helpers (BigDecimal, dates)
│   │       └── SlugUtil.java
│   │
│   ├── modules/
│   │   │
│   │   ├── benchmark/                  ← everything localscore + arena
│   │   │   ├── controller/
│   │   │   │   └── BenchmarkController.java
│   │   │   ├── service/
│   │   │   │   └── BenchmarkService.java
│   │   │   ├── sync/                   ← scraper jobs live here, not in service
│   │   │   │   ├── LocalScoreSyncJob.java
│   │   │   │   └── ArenaSyncJob.java
│   │   │   ├── repository/
│   │   │   │   ├── GpuBenchmarkResultRepository.java
│   │   │   │   ├── GpuBenchmarkDetailRepository.java
│   │   │   │   └── ModelBenchmarkRepository.java
│   │   │   ├── entity/
│   │   │   │   ├── GpuBenchmarkResult.java
│   │   │   │   ├── GpuBenchmarkDetail.java
│   │   │   │   └── ModelBenchmark.java
│   │   │   └── dto/
│   │   │       ├── GpuLeaderboardDTO.java
│   │   │       ├── GpuResultDetailDTO.java
│   │   │       ├── GpuBenchmarkDetailDTO.java
│   │   │       └── SyncStatusDTO.java
│   │   │
│   │   ├── product/                    ← hardware catalog (GPUs, CPUs, RAM, racks)
│   │   │   ├── controller/
│   │   │   │   └── ProductController.java
│   │   │   ├── service/
│   │   │   │   └── ProductService.java
│   │   │   ├── repository/
│   │   │   │   └── ProductRepository.java
│   │   │   ├── entity/
│   │   │   │   └── Product.java
│   │   │   └── dto/
│   │   │       ├── ProductDTO.java
│   │   │       └── ProductFilterRequest.java
│   │   │
│   │   ├── aimodel/                    ← AI model catalog (drives wizard step 2)
│   │   │   ├── controller/
│   │   │   │   └── AiModelController.java
│   │   │   ├── service/
│   │   │   │   └── AiModelService.java
│   │   │   ├── repository/
│   │   │   │   └── AiModelRepository.java
│   │   │   ├── entity/
│   │   │   │   └── AiModel.java
│   │   │   └── dto/
│   │   │       ├── AiModelDTO.java
│   │   │       └── VramRequirementDTO.java
│   │   │
│   │   ├── build/                      ← wizard answers → Claude → build config
│   │   │   ├── controller/
│   │   │   │   └── BuildController.java
│   │   │   ├── service/
│   │   │   │   ├── BuildService.java
│   │   │   │   └── BuildPromptBuilder.java   ← constructs the Claude prompt
│   │   │   ├── client/
│   │   │   │   └── ClaudeClient.java         ← HTTP call to Anthropic API
│   │   │   ├── repository/
│   │   │   │   ├── BuildRepository.java
│   │   │   │   └── BuildItemRepository.java
│   │   │   ├── entity/
│   │   │   │   ├── Build.java
│   │   │   │   └── BuildItem.java
│   │   │   └── dto/
│   │   │       ├── WizardAnswersDTO.java      ← request from frontend
│   │   │       ├── BuildResponseDTO.java      ← response to frontend
│   │   │       ├── BuildItemDTO.java
│   │   │       └── CanvasHintsDTO.java
│   │   │
│   │   └── auth/                       ← JWT, user management
│   │       ├── controller/
│   │       │   └── AuthController.java
│   │       ├── service/
│   │       │   ├── AuthService.java
│   │       │   └── JwtService.java
│   │       ├── repository/
│   │       │   └── UserRepository.java
│   │       ├── entity/
│   │       │   └── User.java
│   │       └── dto/
│   │           ├── LoginRequest.java
│   │           ├── RegisterRequest.java
│   │           └── AuthResponse.java
│   │
│   └── infrastructure/                 ← technical concerns, no domain logic
│       ├── persistence/
│       │   └── SyncLogRepository.java  ← shared by benchmark + build modules
│       └── scheduler/
│           └── SyncLogEntity.java
│
├── src/main/resources/
│   ├── application.yml                 ← base config
│   ├── application-dev.yml             ← dev overrides (local DB, debug logging)
│   ├── application-prod.yml            ← prod overrides (connection pool, etc.)
│   └── db/migration/                   ← Flyway migrations
│       ├── V1__create_users.sql
│       ├── V2__create_products_and_models.sql
│       ├── V3__create_benchmark_tables.sql
│       └── V4__create_build_tables.sql
│
├── src/test/java/com/airigs/
│   ├── modules/
│   │   ├── benchmark/
│   │   │   ├── BenchmarkServiceTest.java
│   │   │   └── LocalScoreSyncJobTest.java
│   │   ├── build/
│   │   │   ├── BuildServiceTest.java
│   │   │   ├── BuildPromptBuilderTest.java
│   │   │   └── ClaudeClientTest.java
│   │   └── product/
│   │       └── ProductServiceTest.java
│   └── common/
│       └── util/
│           └── ParseUtilTest.java
│
├── pom.xml
├── .env.example
└── README.md