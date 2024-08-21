export const changeCaseFirstLetter = (string: string, toLowerCase: boolean) => {
  if (toLowerCase === undefined) {
    
  } else if(toLowerCase) {
     return string.charAt(0).toLowerCase() + string.substr(1);
  } else {
     return string.charAt(0).toUpperCase() + string.substr(1);
  }
};

export const hasCapitalLetters = (string: string) => {
  return /[A-Z]/.test(string);
};

export function singularize(word: string) {
  const endings = {
      ves: 'fe',
      ies: 'y',
      i: 'us',
      zes: 'ze',
      ses: 's',
      es: 'e',
      s: ''
  };
  return word.replace(
      new RegExp(`(${Object.keys(endings).join('|')})$`), 
      (r) => endings[r as keyof typeof endings]
  );
}