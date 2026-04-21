FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY src/FlowBoard.Api/FlowBoard.Api.csproj src/FlowBoard.Api/
COPY src/FlowBoard.Application/FlowBoard.Application.csproj src/FlowBoard.Application/
COPY src/FlowBoard.Infrastructure/FlowBoard.Infrastructure.csproj src/FlowBoard.Infrastructure/
RUN dotnet restore src/FlowBoard.Api/FlowBoard.Api.csproj

COPY src/ src/
RUN dotnet publish src/FlowBoard.Api/FlowBoard.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview
WORKDIR /app
COPY --from=build /app ./

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "FlowBoard.Api.dll"]
