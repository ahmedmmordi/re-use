using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReUse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class fixConversation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_conversations_Users_BuyerId",
                table: "conversations");

            migrationBuilder.DropForeignKey(
                name: "FK_conversations_Users_SellerId",
                table: "conversations");

            migrationBuilder.DropColumn(
                name: "ConversationType",
                table: "conversations");

            migrationBuilder.RenameColumn(
                name: "SellerId",
                table: "conversations",
                newName: "ReactantId");

            migrationBuilder.RenameColumn(
                name: "BuyerId",
                table: "conversations",
                newName: "OwnerId");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_SellerId_Status",
                table: "conversations",
                newName: "IX_conversations_ReactantId_Status");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_ProductId_BuyerId_SellerId",
                table: "conversations",
                newName: "IX_conversations_ProductId_OwnerId_ReactantId");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_BuyerId_Status",
                table: "conversations",
                newName: "IX_conversations_OwnerId_Status");

            migrationBuilder.AddForeignKey(
                name: "FK_conversations_Users_OwnerId",
                table: "conversations",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_conversations_Users_ReactantId",
                table: "conversations",
                column: "ReactantId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_conversations_Users_OwnerId",
                table: "conversations");

            migrationBuilder.DropForeignKey(
                name: "FK_conversations_Users_ReactantId",
                table: "conversations");

            migrationBuilder.RenameColumn(
                name: "ReactantId",
                table: "conversations",
                newName: "SellerId");

            migrationBuilder.RenameColumn(
                name: "OwnerId",
                table: "conversations",
                newName: "BuyerId");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_ReactantId_Status",
                table: "conversations",
                newName: "IX_conversations_SellerId_Status");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_ProductId_OwnerId_ReactantId",
                table: "conversations",
                newName: "IX_conversations_ProductId_BuyerId_SellerId");

            migrationBuilder.RenameIndex(
                name: "IX_conversations_OwnerId_Status",
                table: "conversations",
                newName: "IX_conversations_BuyerId_Status");

            migrationBuilder.AddColumn<string>(
                name: "ConversationType",
                table: "conversations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_conversations_Users_BuyerId",
                table: "conversations",
                column: "BuyerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_conversations_Users_SellerId",
                table: "conversations",
                column: "SellerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}