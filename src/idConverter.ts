const convertAlphabets = {
    "alphabet": "123456789*=+-aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
    "decimals": "0123456789",
}

function reverseString(inputStr: string): string {
    let strArray: Array<string> = inputStr.split(" ");
    let reversedStrArray: Array<string> = strArray.map((word) => {
        let charArray: Array<string> = word.split("");
        charArray.reverse();

        let reversed: string = charArray.join("");
        return reversed;
    }).reverse();

    let reversedStr: string = reversedStrArray.join(" ");
    return reversedStr;
}

function baseConvert(inputStr: string, translation: string, newTranslation: string, shift: boolean): string {
    let x: number = 0;
    let baseValue: number = translation.length;

    for (let i = 0; i < inputStr.length; i++) {
        const digit: string = inputStr[i];
        let digitIndex: number = translation.indexOf(digit) + 1;
        console.log(digit, digitIndex);
        digitIndex -= shift ? 1 : 0

        x = x * baseValue + digitIndex
    }

    if (x != 0) {
        let result: string = "";
        const newBaseVal = newTranslation.length;

        while (x > 0) {
            let digitVal: number = x % newBaseVal;
            digitVal -= shift ? 1 : 0;
            let appendNew = digitVal == -1 ? "0" : newTranslation[digitVal];

            if (appendNew == undefined)
                return shift ? reverseString(`ID Error: ${digitVal} index is out of range`) : `ID Error: ${digitVal} index is out of range`;

            result = `${appendNew}${result}`;
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