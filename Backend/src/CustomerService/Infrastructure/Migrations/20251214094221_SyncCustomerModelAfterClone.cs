using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncCustomerModelAfterClone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Resellers_Name",
                table: "Resellers",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Resellers_Type",
                table: "Resellers",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders",
                column: "OrderNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderType",
                table: "Orders",
                column: "OrderType");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_StartDate",
                table: "Orders",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status",
                table: "Orders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ContractNumber",
                table: "Contracts",
                column: "ContractNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_Email",
                table: "Contracts",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_StartDate",
                table: "Contracts",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_ContractHistories_Timestamp",
                table: "ContractHistories",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_HouseNumber",
                table: "Addresses",
                column: "HouseNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_ZipCode",
                table: "Addresses",
                column: "ZipCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Resellers_Name",
                table: "Resellers");

            migrationBuilder.DropIndex(
                name: "IX_Resellers_Type",
                table: "Resellers");

            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderType",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_StartDate",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_ContractNumber",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_Email",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_StartDate",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_ContractHistories_Timestamp",
                table: "ContractHistories");

            migrationBuilder.DropIndex(
                name: "IX_Addresses_HouseNumber",
                table: "Addresses");

            migrationBuilder.DropIndex(
                name: "IX_Addresses_ZipCode",
                table: "Addresses");
        }
    }
}
