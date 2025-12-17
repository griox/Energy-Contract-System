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

# --- BƯỚC 1: COPY FILE CSPROJ ---
COPY ["Backend/src/CustomerService/Api/Api.csproj", "Backend/src/CustomerService/Api/"]
COPY ["Backend/src/CustomerService/Application/Application.csproj", "Backend/src/CustomerService/Application/"]
COPY ["Backend/src/CustomerService/Domain/Domain.csproj", "Backend/src/CustomerService/Domain/"]
COPY ["Backend/src/CustomerService/Infrastructure/Infrastructure.csproj", "Backend/src/CustomerService/Infrastructure/"]

# Restore
RUN dotnet restore "Backend/src/CustomerService/Api/Api.csproj"

# --- BƯỚC 2: COPY SOURCE CODE (SỬA Ở ĐÂY) ---
# ❌ ĐỪNG DÙNG: COPY . . (Nó sẽ copy cả ContractHistoryService gây lỗi)
# ✅ HÃY DÙNG: Chỉ copy thư mục CustomerService
COPY ["Backend/src/CustomerService/", "Backend/src/CustomerService/"]

# (Nếu bạn có dùng Shared folder không có csproj, hãy copy thêm dòng này)
# COPY ["Backend/src/Shared/", "Backend/src/Shared/"]

# --- BƯỚC 3: BUILD & PUBLISH ---
WORKDIR "/src/Backend/src/CustomerService/Api"

RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CustomerService.Api.dll"]