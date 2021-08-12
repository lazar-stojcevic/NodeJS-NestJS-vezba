import * as Validator from 'class-validator';

export class ChangeOrderStatusDTO{
    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.IsIn(["rejected", "accepted", "shipped", "pending"])
    newStatus: "rejected" | "accepted" | "shipped" | "pending";
}