using System;

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReUse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "RatingsAverage",
                table: "Users",
                type: "numeric(3,2)",
                precision: 3,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RatingsCount",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "user_ratings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    RaterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RateeUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Stars = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_ratings", x => x.Id);
                    table.CheckConstraint("CK_UserRating_Rater_Not_Ratee", "\"RaterUserId\" <> \"RateeUserId\"");
                    table.CheckConstraint("CK_UserRating_Stars_1_5", "\"Stars\" BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_user_ratings_Users_RateeUserId",
                        column: x => x.RateeUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_ratings_Users_RaterUserId",
                        column: x => x.RaterUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_ratings_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_ratings_ProductId_RaterUserId",
                table: "user_ratings",
                columns: new[] { "ProductId", "RaterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_ratings_RateeUserId_CreatedAt",
                table: "user_ratings",
                columns: new[] { "RateeUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_user_ratings_RaterUserId",
                table: "user_ratings",
                column: "RaterUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_ratings");

            migrationBuilder.DropColumn(
                name: "RatingsAverage",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RatingsCount",
                table: "Users");
        }
    }
}