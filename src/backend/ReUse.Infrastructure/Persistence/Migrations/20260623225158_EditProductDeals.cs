using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReUse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EditProductDeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductDeals_Users_BuyerId",
                table: "ProductDeals");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductDeals_Users_SellerId",
                table: "ProductDeals");

            migrationBuilder.DropColumn(
                name: "BuyerConfirmed",
                table: "ProductDeals");

            migrationBuilder.DropColumn(
                name: "SellerConfirmed",
                table: "ProductDeals");

            migrationBuilder.RenameColumn(
                name: "SellerId",
                table: "ProductDeals",
                newName: "ReceiverId");

            migrationBuilder.RenameColumn(
                name: "BuyerId",
                table: "ProductDeals",
                newName: "ProposerId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductDeals_SellerId",
                table: "ProductDeals",
                newName: "IX_ProductDeals_ReceiverId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductDeals_BuyerId",
                table: "ProductDeals",
                newName: "IX_ProductDeals_ProposerId");

            migrationBuilder.AlterColumn<string>(
                name: "DealType",
                table: "ProductDeals",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ProductDeals",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductDeals_Users_ProposerId",
                table: "ProductDeals",
                column: "ProposerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductDeals_Users_ReceiverId",
                table: "ProductDeals",
                column: "ReceiverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductDeals_Users_ProposerId",
                table: "ProductDeals");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductDeals_Users_ReceiverId",
                table: "ProductDeals");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ProductDeals");

            migrationBuilder.RenameColumn(
                name: "ReceiverId",
                table: "ProductDeals",
                newName: "SellerId");

            migrationBuilder.RenameColumn(
                name: "ProposerId",
                table: "ProductDeals",
                newName: "BuyerId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductDeals_ReceiverId",
                table: "ProductDeals",
                newName: "IX_ProductDeals_SellerId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductDeals_ProposerId",
                table: "ProductDeals",
                newName: "IX_ProductDeals_BuyerId");

            migrationBuilder.AlterColumn<string>(
                name: "DealType",
                table: "ProductDeals",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AddColumn<bool>(
                name: "BuyerConfirmed",
                table: "ProductDeals",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SellerConfirmed",
                table: "ProductDeals",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductDeals_Users_BuyerId",
                table: "ProductDeals",
                column: "BuyerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductDeals_Users_SellerId",
                table: "ProductDeals",
                column: "SellerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}