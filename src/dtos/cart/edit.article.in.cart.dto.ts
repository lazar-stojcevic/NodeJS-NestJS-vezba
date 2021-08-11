import * as Validator from 'class-validator';
export class EditArticleInCartDTO {
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