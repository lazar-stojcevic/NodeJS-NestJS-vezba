import * as Validator from 'class-validator';
export class addArticleToCartDTO {
    articleId: number;

    @Validator.IsNotEmpty()
    @Validator.IsNumber({
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 0
    })
    @Validator.IsPositive()
    quantity: number;
}