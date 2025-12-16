# 1. Base Image (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Build Image (SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# 👇 QUAN TRỌNG: Copy file csproj từ đường dẫn gốc
# Lưu ý: Tôi giả định cấu trúc là Backend/src/... nếu sai bạn sửa lại đường dẫn này
COPY ["Backend/src/AuthService/Api.csproj", "Backend/src/AuthService/"]

# 👇 Nếu bạn có project Shared (như lỗi ở bài trước), hãy bỏ comment dòng dưới và sửa đường dẫn
# COPY ["Backend/src/Shared/Shared.csproj", "Backend/src/Shared/"]

# Restore các thư viện
RUN dotnet restore "Backend/src/AuthService/Api.csproj"

# Copy toàn bộ source code vào image
COPY . .

# 👇 Chuyển con trỏ vào đúng thư mục chứa code AuthService
WORKDIR "/src/Backend/src/AuthService"

# Build project
RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 3. Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final (Chạy app)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]