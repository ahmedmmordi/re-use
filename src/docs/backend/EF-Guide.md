# Entity Framework Guide

## Add Entity to EF
- we set the entitis in Domain layer so if want add new entity to EF we need to add it in Domain layer.
- add your entity to the DbContext class in the Infrastructure layer in src/backend/ReUse.Infrastructure/Persistence/ApplicationDbContext.cs file.
- we use fluent API to configure the entity in separate class in the Infrastructure layer in src/backend/ReUse.Infrastructure/Persistence/Configurations folder.
  - so create new class for your entity name it <EntityName>EntityTypeConfiguration.cs 
  - then implement the IEntityTypeConfiguration interface and override the Configure method to configure the entity.
Like it:
```csharp
namespace ReUse.Infrastructure.Persistence.Configurations;

public class TestEntityTypeConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Test> builder)
    {
        // configure the entity here
    }
}
```

## Migrations
- after adding the entity to the DbContext and configuring it, you need to create a migration to update the database schema.
- Our migrations are located in the src/backend/ReUse.Infrastructure/Persistence/Migrations folder.
- to create a migration, run the following command in the terminal:
```bash
dotnet ef migrations add <MigrationName> -p src/backend/ReUse.Infrastructure -s src/backend/ReUse.API -c ApplicationDbContext -o Persistence/Migrations
```
- replace <MigrationName> with a descriptive name for your migration, such as AddTestEntity

- after creating the migration, you need to apply it to the database by running the following command:
```bash
dotnet ef database update -p src/backend/ReUse.Infrastructure -s src/backend/ReUse.API -c ApplicationDbContext
```
- this command will apply the pending migrations to the database and update the schema accordingly.