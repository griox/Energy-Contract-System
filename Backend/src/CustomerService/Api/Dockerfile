# 1. Base Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Build Image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# 👇 QUAN TRỌNG: Copy tất cả các layer (Clean Architecture) từ gốc
# Lưu ý: Tôi đang dùng đường dẫn 'Backend/src/CustomerService/...'
# Nếu cấu trúc thư mục thực tế khác, bạn hãy sửa lại phần đầu nhé.

COPY ["Backend/src/CustomerService/Api/Api.csproj", "Backend/src/CustomerService/Api/"]
COPY ["Backend/src/CustomerService/Application/Application.csproj", "Backend/src/CustomerService/Application/"]
COPY ["Backend/src/CustomerService/Domain/Domain.csproj", "Backend/src/CustomerService/Domain/"]
COPY ["Backend/src/CustomerService/Infrastructure/Infrastructure.csproj", "Backend/src/CustomerService/Infrastructure/"]



# Restore từ project chính (Api)
RUN dotnet restore "Backend/src/CustomerService/Api/Api.csproj"

# Copy toàn bộ code
COPY . .

# 👇 Chuyển Workdir vào đúng thư mục chứa Api để build
WORKDIR "/src/Backend/src/CustomerService/Api"

# Build
RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 3. Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# ⚠️ LƯU Ý TÊN FILE DLL:
# Mặc định project tên "Api.csproj" sẽ sinh ra "Api.dll".
# Dockerfile cũ của bạn ghi là "CustomerService.Api.dll".
# Nếu bạn đã cấu hình <AssemblyName> trong csproj thì giữ nguyên tên cũ.
# Còn nếu không, hãy dùng "Api.dll" như dưới đây:
ENTRYPOINT ["dotnet", "Api.dll"]