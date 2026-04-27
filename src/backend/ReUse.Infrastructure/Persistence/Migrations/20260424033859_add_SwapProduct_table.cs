using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReUse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class add_SwapProduct_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WantedCondition",
                table: "products",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WantedItemDescription",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WantedItemTitle",
                table: "products",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WantedCondition",
                table: "products");

            migrationBuilder.DropColumn(
                name: "WantedItemDescription",
                table: "products");

            migrationBuilder.DropColumn(
                name: "WantedItemTitle",
                table: "products");
        }
    }
}