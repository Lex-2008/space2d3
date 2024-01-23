// functions to convert RGB to L*ab and back
// from http://www.easyrgb.com/en/math.php
// via https://stackoverflow.com/q/15408522
// not actually used here, though

export function RGBtoLAB(hex: string) {
    // hexToRgb from https://stackoverflow.com/a/11508164
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    let var_R = (r / 255); //R from 0 to 255
    let var_G = (g / 255); //G from 0 to 255
    let var_B = (b / 255); //B from 0 to 255

    if (var_R > 0.04045) var_R = Math.pow(((var_R + 0.055) / 1.055), 2.4);
    else var_R = var_R / 12.92;
    if (var_G > 0.04045) var_G = Math.pow(((var_G + 0.055) / 1.055), 2.4);
    else var_G = var_G / 12.92;
    if (var_B > 0.04045) var_B = Math.pow(((var_B + 0.055) / 1.055), 2.4);
    else var_B = var_B / 12.92;

    var_R = var_R * 100;
    var_G = var_G * 100;
    var_B = var_B * 100;

    //Observer. = 2В°, Illuminant = D65
    const x = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805;
    const y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722;
    const z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505;
    let ref_X = 95.047;
    let ref_Y = 100;
    let ref_Z = 108.883;

    let var_X = x / ref_X; //ref_X =  95.047   Observer= 2В°, Illuminant= D65
    let var_Y = y / ref_Y; //ref_Y = 100.000
    let var_Z = z / ref_Z; //ref_Z = 108.883

    if (var_X > 0.008856) var_X = Math.pow(var_X, 1 / 3);
    else var_X = (7.787 * var_X) + (16 / 116);
    if (var_Y > 0.008856) var_Y = Math.pow(var_Y, 1 / 3);
    else var_Y = (7.787 * var_Y) + (16 / 116);
    if (var_Z > 0.008856) var_Z = Math.pow(var_Z, 1 / 3);
    else var_Z = (7.787 * var_Z) + (16 / 116);

    let CIE_L = (116 * var_Y) - 16;
    let CIE_a = 500 * (var_X - var_Y);
    let CIE_b = 200 * (var_Y - var_Z);

    return [CIE_L, CIE_a, CIE_b];
}


export function LABtoRGB([l, a, b]) {
    let var_Y = (l + 16) / 116;
    let var_X = a / 500 + var_Y;
    let var_Z = var_Y - b / 200;

    const ref_X = 95.047;
    const ref_Y = 100;
    const ref_Z = 108.883;

    let [X, Y, Z] = [var_X, var_Y, var_Z]
        .map(n => Math.pow(n, 3) > 0.008856
            ? Math.pow(n, 3)
            : (n - 16 / 116) / 7.787);

    X *= ref_X;
    Y *= ref_Y;
    Z *= ref_Z;

    var_X = X / 100;
    var_Y = Y / 100;
    var_Z = Z / 100;

    let var_R = var_X * 3.2406 + var_Y * (-1.5372) + var_Z * (-0.4986);
    let var_G = var_X * (-0.9689) + var_Y * 1.8758 + var_Z * 0.0415;
    let var_B = var_X * 0.0557 + var_Y * (-0.204) + var_Z * 1.057;

    [var_R, var_G, var_B] = [var_R, var_G, var_B]
        .map(n => n > 0.0031308
            ? 1.055 * Math.pow(n, (1 / 2.4)) - 0.055
            : 12.92 * n)
        .map(n => Math.round(n * 255));

    return (1 << 24 | var_R << 16 | var_G << 8 | var_B).toString(16).slice(1);
}


// slightly simplified functions which we actually use
export function RGBtoL(hex: string) {
    // hexToRgb from https://stackoverflow.com/a/11508164
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    let var_R = (r / 255); //R from 0 to 255
    let var_G = (g / 255); //G from 0 to 255
    let var_B = (b / 255); //B from 0 to 255

    if (var_R > 0.04045) var_R = Math.pow(((var_R + 0.055) / 1.055), 2.4);
    else var_R = var_R / 12.92;
    if (var_G > 0.04045) var_G = Math.pow(((var_G + 0.055) / 1.055), 2.4);
    else var_G = var_G / 12.92;
    if (var_B > 0.04045) var_B = Math.pow(((var_B + 0.055) / 1.055), 2.4);
    else var_B = var_B / 12.92;

    var_R = var_R * 100;
    var_G = var_G * 100;
    var_B = var_B * 100;

    //Observer. = 2В°, Illuminant = D65
    const y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722;
    let ref_Y = 100;

    let var_Y = y / ref_Y; //ref_Y = 100.000

    if (var_Y > 0.008856) var_Y = Math.pow(var_Y, 1 / 3);
    else var_Y = (7.787 * var_Y) + (16 / 116);

    let CIE_L = (116 * var_Y) - 16;

    return CIE_L;
}


export function LtoRGB(l) {
    let var_Y = (l + 16) / 116;
    let var_X = var_Y;
    let var_Z = var_Y;

    const ref_X = 95.047;
    const ref_Y = 100;
    const ref_Z = 108.883;

    let [X, Y, Z] = [var_X, var_Y, var_Z]
        .map(n => Math.pow(n, 3) > 0.008856
            ? Math.pow(n, 3)
            : (n - 16 / 116) / 7.787);

    X *= ref_X;
    Y *= ref_Y;
    Z *= ref_Z;

    var_X = X / 100;
    var_Y = Y / 100;
    var_Z = Z / 100;

    let var_R = var_X * 3.2406 + var_Y * (-1.5372) + var_Z * (-0.4986);

    let r = var_R > 0.0031308
        ? 1.055 * Math.pow(var_R, (1 / 2.4)) - 0.055
        : 12.92 * var_R;
    r = Math.round(r * 255);

    return '#' + (1 << 24 | r << 16 | r << 8 | r).toString(16).slice(1);
}
