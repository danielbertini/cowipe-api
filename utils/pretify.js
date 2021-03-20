var moment = require("moment");

module.exports.phone = string => {
    if (!string) {
        return null;
    } else {
        let result = string;
        result = result.replace("+55", "");
        result = result.match(/^(\d{2})(\d{1})(\d{4})(\d{4})$/);
        return `(${result[1]}) ${result[2]} ${result[3]}-${result[4]}`;
    }
}

module.exports.phone = string => {
    if (!string) {
        return null;
    } else {
        let result = string;
        result = result.replace("+55", "");
        result = result.match(/^(\d{2})(\d{1})(\d{4})(\d{4})$/);
        return `(${result[1]}) ${result[2]} ${result[3]}-${result[4]}`;
    }
}

module.exports.cpf = string => {
    if (!string) {
        return null;
    } else {
        let result = string;
        result = result.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
        return `${result[1]}.${result[2]}.${result[3]}-${result[4]}`;
    }
}

module.exports.birthdate = string => {
    if (!string) {
        return null;
    } else {
        let result = moment(string).format('DD/MM/YYYY');
        return result;
    }
}