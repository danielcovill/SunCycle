function getSecondsSinceMidnight(time) {
  return (time - new Date(time.getFullYear(), time.getMonth(), time.getDate())) / 1000;
}

function trueMod(value, n) {
	return ((value%n)+n)%n;
}

function isColorDark(inputColor) {
	let colors = [];
	let colorLumocities = [];
	// is it a gradient? If so, split it up and average the results 
	// (note that this is just an average and doesn't weight for color stops)
	if(inputColor.includes("gradient")) {
		inputColor = inputColor.substring(inputColor.indexOf("(")+1, inputColor.lastIndexOf(")"));
		colors = inputColor.split( /,(?![^(]*\))(?![^"']*["'](?:[^"']*["'][^"']*["'])*[^"']*$)/ );
		colors.shift();
	} else {
		colors.push(inputColor);
	}

	colors.forEach((color) => {
		color = color.trim();
		if(color.startsWith("#")) {
			colorLumocities.push(computeLumocity(
				parseInt(rgbHex.slice(1,3), 16), 
				parseInt(rgbHex.slice(3,5), 16), 
				parseInt(rgbHex.slice(5,7), 16)
			));
		} else if (color.startsWith("rgb")) {
			color = color.substring(color.indexOf("(")+1, color.indexOf(")")).split(",");
			colorLumocities.push(computeLumocity(
				color[0],
				color[1],
				color[2]
			));
		} else if (color.startsWith("hsl")) {
			color = color.substring(color.indexOf("(")+1, color.indexOf(")")).split(",");
			let rgb = hslToRgb(color[0], 
				color[1].slice(0,color[1].length-1),
				color[2].slice(0,color[2].length-1));
			colorLumocities.push(computeLumocity(
				rgb[0], rgb[1], rgb[2]
			));
		}
	});
	
	let averageLumocity = 0;
	if(colorLumocities.length > 1) {
		colorLumocities.forEach((lumocity) => {
			averageLumocity += (lumocity - .15);
		});
		averageLumocity /= colorLumocities.length;
	} else {
		averageLumocity = colorLumocities[0];
	}
	return averageLumocity <= .5;
}

function hslToRgb(h, s, l) {
	let r, g, b;
	if(s == 0) {
		r = g = b = l; // achromatic
	} else {
		let hue2rgb = function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}
		let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		let p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function computeLumocity(r, g, b) {
	return ((0.299 * r + 0.587 * g + 0.114 * b) / 255);
}

function getColorsByTimeOfDay(forTime, sunrise, sunset) {
	/* */
	const forTimeSecs = getSecondsSinceMidnight(forTime);
	const sunriseSecs = getSecondsSinceMidnight(sunrise);
	const sunsetSecs = getSecondsSinceMidnight(sunset);
	let h1;
	let h2;
	let l1;
	let l2;
 
	let pctDaylight;
	if (forTimeSecs < sunriseSecs) {
		pctDaylight = 1 - ((sunriseSecs - forTimeSecs) / 3600);
	} else if (forTimeSecs > sunsetSecs) {
		pctDaylight = 1 - ((forTimeSecs - sunsetSecs) / 3600);
	} else {
		pctDaylight = 1;
	}
	if(pctDaylight < 0) { pctDaylight = 0; }

	//509.4161022 x3 - 1074.741378 x2 + 738.7242538 x - 125.8247358
	h1 = trueMod((-125 
		+ 738.72 * pctDaylight 
		- 1074.74 * Math.pow(pctDaylight, 2) 
		+ 509.416 * Math.pow(pctDaylight, 3)), 360); 
	//27.99005594 x3 - 66.9289297 x2 + 16.125988 x + 239.6656059
	h2 = trueMod((239.66
		+ 16.13 * pctDaylight 
		- 66.93 * Math.pow(pctDaylight, 2) 
		+ 27.99 * Math.pow(pctDaylight, 3)), 360);
	//-124.0724476 x3 + 207.6429693 x2 + 6.377867973 x + 13.16696641
	l1 = 13.17
		+ 6.38 * pctDaylight 
		+ 207.64 * Math.pow(pctDaylight, 2) 
		- 124.07 * Math.pow(pctDaylight, 3);
	//-165.5058045 x3 + 291.8064645 x2 - 85.66511939 x + 18.1578807
	l2 = 18.16 
		- 85.66 * pctDaylight 
		+ 291.81 * Math.pow(pctDaylight, 2) 
		- 165.50 * Math.pow(pctDaylight, 3);

	return `linear-gradient(0deg, hsl(${h1}, 100%, ${l1}%) 0%, hsl(${h2}, 100%, ${l2}%) 100%)`;
}

let now = new Date(2018, 1, 1, 5, 30, 0);
const sunrise = new Date(2018, 1, 1, 7, 0, 0);
const sunset = new Date(2018, 1, 1, 17, 0, 0);
let nowSecs = getSecondsSinceMidnight(now);
const sunriseSecs = getSecondsSinceMidnight(sunrise);
const sunsetSecs = getSecondsSinceMidnight(sunset);

let demo = setInterval(() => {
  let colors = getColorsByTimeOfDay(now, sunrise, sunset);
	document.body.style.background = colors;
	document.body.innerHTML = now.toLocaleTimeString();
	document.body.style.color = isColorDark(document.body.style.background) ? "white" : "black";
	if(nowSecs > sunriseSecs && nowSecs < sunsetSecs) {
		now = new Date(now.getTime() + 36000);
	} else {
		now = new Date(now.getTime() + 1000);
	}
	nowSecs = getSecondsSinceMidnight(now);
	if(nowSecs > (sunsetSecs + 5400)) {
		clearInterval(demo);
	}
}, 3);