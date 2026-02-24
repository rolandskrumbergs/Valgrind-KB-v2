# EF Core Migrations

All commands should be run from the **solution root** directory.

## Add a New Migration

```bash
dotnet ef migrations add <MigrationName> --project KB.Infrastructure --startup-project KB.Operations --output-dir Data/Migrations
```

## Remove the Last Migration

```bash
dotnet ef migrations remove --project KB.Infrastructure --startup-project KB.Operations
```

## Update Database to Latest Migration

```bash
dotnet ef database update --project KB.Infrastructure --startup-project KB.Operations
```

## Update Database to a Specific Migration

```bash
dotnet ef database update <MigrationName> --project KB.Infrastructure --startup-project KB.Operations
```

## Generate SQL Script

```bash
dotnet ef migrations script --project KB.Infrastructure --startup-project KB.Operations -o migrations.sql
```

## List All Migrations

```bash
dotnet ef migrations list --project KB.Infrastructure --startup-project KB.Operations
```
