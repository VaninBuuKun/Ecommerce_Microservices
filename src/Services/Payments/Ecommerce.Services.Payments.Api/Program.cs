using System.Reflection;
using BuildingBlocks.Application;
using BuildingBlocks.Auth;
using BuildingBlocks.EfCore;
using BuildingBlocks.EfCore.Persistence.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using BuildingBlocks.Web.Extensions;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Persistances;
using Ecommerce.Services.Payments.Api.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

//MyDi
builder.Services.AddControllers();
var connectionString = builder.Configuration.GetConnectionString("Database");

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
builder.Services.AddScoped<IEfUnitOfWork, EfUnitOfWork<PaymentDbContext>>();


//BuildingBlocks
builder.Services.AddBuildingBlocksWeb();
builder.Services.AddBuildingBlocksInfrastructure(builder.Configuration);
builder.Services.AddBuildingBlocsAuth(builder.Configuration);
builder.Services.AddBuildingBlocksApplication(Assembly.GetExecutingAssembly());


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();