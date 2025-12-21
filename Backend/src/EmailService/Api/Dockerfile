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

# --- BƯỚC 1: COPY FILE CSPROJ (XÓA Backend/) ---

# Copy Shared.Logging (để restore được)
COPY ["Shared.Logging/Shared.Logging.csproj", "Shared.Logging/"]

# Copy EmailService Api
COPY ["src/EmailService/Api/Api.csproj", "src/EmailService/Api/"]

# Restore
RUN dotnet restore "src/EmailService/Api/Api.csproj"

# --- BƯỚC 2: COPY SOURCE CODE (XÓA Backend/) ---

# Copy toàn bộ code Shared.Logging
COPY ["Shared.Logging/", "Shared.Logging/"]

# Copy toàn bộ code EmailService
COPY ["src/EmailService/", "src/EmailService/"]

# --- BƯỚC 3: BUILD & PUBLISH ---
# Chuyển vào thư mục chứa file csproj
WORKDIR "/src/src/EmailService/Api"

RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# LƯU Ý: Tên file DLL thường là tên Project. 
# Nếu Project tên là "Api" thì là "Api.dll", nếu là "EmailService.Api" thì sửa lại.
ENTRYPOINT ["dotnet", "EmailService.Api.dll"]