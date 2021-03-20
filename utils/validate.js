var validator = require("validator");
var moment = require("moment");

module.exports.token = (request, response, next) => {
  jwt.verify(request.headers.authorization, config.jwt.secret, (error, decode) => {
    if (error) {
      response.status(403).send({
        success: false, 
        message: 'Sessão expirada',
      });      
    } else {
      next();
    }
  });  
};

module.exports.name = string => {
  return string.trim().split(" ").length > 1 ? true : false;
}

module.exports.isEmpty = string => {
  if(typeof string === 'undefined') {
    return true;
  } else if (string === null){
    return true;
  } else if (validator.isEmpty(string, {ignore_whitespace:true})){
    return true;
  } else {
    return false;
  }
}

module.exports.email = string => {
  return !validator.isEmail(string) ? true : false;
}

module.exports.phone = string => {
  return validator.isMobilePhone(string, "pt-BR") ? true : false;
}

module.exports.birthdate = string => {
  let years = moment().diff(string, 'years');
  if (years > 100 || years < 5 || !validator.isBefore(string)) {
    return false;
  } else {
    return true;
  }
}

module.exports.phone = string => {
  if (string.length == 10) {
    if (
      string == "0000000000" ||
      string == "1111111111" ||
      string == "2222222222" ||
      string == "3333333333" ||
      string == "4444444444" ||
      string == "5555555555" ||
      string == "6666666666" ||
      string == "7777777777" ||
      string == "8888888888" ||
      string == "9999999999"
    ) {
      return false;
    }
  } else {
    return false;
  }
  return true;
};

module.exports.cellphone = string => {
  if (string.length == 11) {
    if (
      string == "00000000000" ||
      string == "11111111111" ||
      string == "22222222222" ||
      string == "33333333333" ||
      string == "44444444444" ||
      string == "55555555555" ||
      string == "66666666666" ||
      string == "77777777777" ||
      string == "88888888888" ||
      string == "99999999999"
    ) {
      return false;
    }
  } else {
    return false;
  }
  return true;
};

module.exports.cpf = string => {
  let soma;
  let resto;
  soma = 0;   
  if (
    string == "00000000000" ||
    string == "11111111111" ||
    string == "22222222222" ||
    string == "33333333333" ||
    string == "44444444444" ||
    string == "55555555555" ||
    string == "66666666666" ||
    string == "77777777777" ||
    string == "88888888888" ||
    string == "99999999999"
  ) {
    return false;
  }
  for (i=1; i<=9; i++) {
    soma = soma + parseInt(string.substring(i-1, i)) * (11 - i); 
  }
  resto = (soma * 10) % 11;
  if ((resto == 10) || (resto == 11)) {
    resto = 0;
  }
  if (resto != parseInt(string.substring(9, 10))){
    return false;
  }
  soma = 0;
  for (i = 1; i <= 10; i++){
    soma = soma + parseInt(string.substring(i-1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if ((resto == 10) || (resto == 11)) {
    resto = 0;
  }
  if (resto != parseInt(string.substring(10, 11) )){
    return false;
  }
  return true;    
}


module.exports.cnpj = string => {
  string = string.replace(/[^\d]+/g,'');
  if(string == '') return false;
  if (string.length != 14)
      return false;
  if (string == "00000000000000" || 
      string == "11111111111111" || 
      string == "22222222222222" || 
      string == "33333333333333" || 
      string == "44444444444444" || 
      string == "55555555555555" || 
      string == "66666666666666" || 
      string == "77777777777777" || 
      string == "88888888888888" || 
      string == "99999999999999")
      return false;
  tamanho = string.length - 2
  numeros = string.substring(0,tamanho);
  digitos = string.substring(tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2)
          pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0))
      return false;
  tamanho = tamanho + 1;
  numeros = string.substring(0,tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2)
          pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1))
        return false;
  return true;
};

module.exports.getZodiac = (day, month) => {
  switch (month) {
    case 1:
      if (day <= 19) { return 10 } else { return 11 }
      break;
    case 2:
      if (day <= 18) { return 11 } else { return 12 }
      break;
    case 3:
      if (day <= 20) { return 12 } else { return 1 }
      break;
    case 4:
      if (day <= 19) { return 1 } else { return 2 }
      break;
    case 5:
      if (day <= 20) { return 2 } else { return 3 }
      break;
    case 6:
      if (day <= 20) { return 3 } else { return 4 }
      break;
    case 7:
      if (day <= 22) { return 4 } else { return 5 }
      break;
    case 8:
      if (day <= 22) { return 5 } else { return 6 }
      break;
    case 9:
      if (day <= 22) { return 6 } else { return 7 }
      break;
    case 10:
      if (day <= 22) { return 7 } else { return 8 }
      break;
    case 11:
      if (day <= 21) { return 8 } else { return 9 }
      break;
    case 12:
      if (day <= 21) { return 9 } else { return 10 }
      break;
    default:
      return null;
    break;
  };
};