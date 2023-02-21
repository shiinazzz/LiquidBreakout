const convertAlphabets = {
    "alphabet": "123456789*_=+-/.aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
    "decimals": "0123456789",
}

function reverseString(inputStr: string): string {
    let strArray: Array<string> = inputStr.split(" ");
    let reversedStrArray: Array<string> = strArray.map((word) => {
        let charArray: Array<string> = word.split("");
        charArray.reverse();

        let reversed: string = charArray.join("");
        return reversed;
    });

    let reversedStr: string = reversedStrArray.join(" ");
    return reversedStr;
}

function baseConvert(inputStr: string, translation: string, newTranslation: string, shift: boolean): string {
    let x: number = 0;
    let baseValue: number = translation.length;

    for (let i = 0; i < inputStr.length; i++) {
        const digit: string = inputStr[i];
        let digitIndex: number = translation.indexOf(digit);
        digitIndex += shift ? 0 : 1

        x = x * baseValue + digitIndex
    }

    if (x != 0) {
        let result: string = "";
        const newBaseVal = newTranslation.length;

        while (x > 0) {
            let digitVal: number = x % newBaseVal;
            digitVal -= shift ? 1 : 0;

            result = `${digitVal == 0 ? "0" : newTranslation[digitVal]}${result}`;
            x = Math.floor(x / newBaseVal);
        }

        return result;
    } else return newTranslation[0]
}

function convertToShort(inputStr: string): string {
    return reverseString(baseConvert(inputStr, convertAlphabets.decimals, convertAlphabets.alphabet, true));
}

function convertToNumber(inputStr: string): string {
    return baseConvert(reverseString(inputStr), convertAlphabets.alphabet, convertAlphabets.decimals, false);
}

export {convertToShort, convertToNumber}