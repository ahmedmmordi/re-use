using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReUse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class fixConversationConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Conversation_Buyer_Not_Seller",
                table: "conversations");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Conversation_Buyer_Not_Seller",
                table: "conversations",
                sql: "\"OwnerId\" <> \"ReactantId\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Conversation_Buyer_Not_Seller",
                table: "conversations");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Conversation_Buyer_Not_Seller",
                table: "conversations",
                sql: "\"BuyerId\" <> \"SellerId\"");
        }
    }
}