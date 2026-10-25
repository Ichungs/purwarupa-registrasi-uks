const API_KEY="c3a6b35143b3b628c58ff69198b3ade0";
const GEO_API="https://api.openweathermap.org/geo/1.0/direct";

let unit="metric";
let currentCity="";
let lightningInterval;

/* 📍 AUTO LOCATION */
function getLocationWeather(){

if(!navigator.geolocation){
return;
}

navigator.geolocation.getCurrentPosition(pos=>{

let lat=pos.coords.latitude;
let lon=pos.coords.longitude;

fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`)
.then(res=>res.json())
.then(data=>{
if(data.cod!=200) return;

currentCity=data.name;

showWeather(data);
setWeatherEffect(data.weather[0].main);
setBackground(data.weather[0].main);
getForecast(data.name);

localStorage.setItem("lastCity",data.name);
});

});
}

/* WEATHER */
function getWeather(){
let city=document.getElementById("cityInput").value;
if(!city) return;

currentCity=city;

fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${API_KEY}`)
.then(res=>res.json())
.then(data=>{
if(data.cod!=200){
document.getElementById("weatherBox").innerHTML="Kota ga ditemukan";
return;
}
showWeather(data);
setWeatherEffect(data.weather[0].main);
setBackground(data.weather[0].main);
saveRecent(city);
getForecast(city);

localStorage.setItem("lastCity",city);
});
}

/* DETAIL */
function showWeather(data){

let symbol=unit==="metric"?"°C":"°F";

document.getElementById("weatherBox").innerHTML=`
<button id="favBtn" onclick="toggleFavorite()">⭐</button>

<h2>${data.name}</h2>

<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">

<div class="temp">${Math.round(data.main.temp)}${symbol}</div>

<p>${data.weather[0].main}</p>

<div class="details">
<p>Feels like: ${Math.round(data.main.feels_like)}${symbol}</p>
<p>Humidity: ${data.main.humidity}%</p>
<p>Wind: ${data.wind.speed} m/s</p>
<p>Pressure: ${data.main.pressure} hPa</p>
</div>
`;

updateFavBtn();
}

/* 🌧 EFFECT */
function setWeatherEffect(weather){

document.getElementById("rain").innerHTML="";
clearInterval(lightningInterval);

if(weather==="Rain"||weather==="Drizzle"){
createRain();
}
if(weather==="Thunderstorm"){
createRain();
lightningInterval=setInterval(triggerLightning,3000);
}
}

function createRain(){
const rain=document.getElementById("rain");
for(let i=0;i<100;i++){
let drop=document.createElement("div");
drop.classList.add("raindrop");
drop.style.left=Math.random()*100+"%";
drop.style.animationDuration=(0.5+Math.random())+"s";
rain.appendChild(drop);
}
}

function triggerLightning(){
let el=document.getElementById("lightning");
el.classList.add("flash");
setTimeout(()=>el.classList.remove("flash"),300);
}

/* 🌈 BACKGROUND */
function setBackground(weather){

const body=document.body;

body.classList.remove("sunny","rainy","cloudy","storm");

if(weather==="Clear"){
body.classList.add("sunny");
}
else if(weather==="Rain"||weather==="Drizzle"){
body.classList.add("rainy");
}
else if(weather==="Thunderstorm"){
body.classList.add("storm");
}
else{
body.classList.add("cloudy");
}

}

/* FORECAST */
function getForecast(city){
fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`)
.then(res=>res.json())
.then(data=>{
let html="";
for(let i=0;i<5;i++){
let item=data.list[i*8];
let day=new Date(item.dt_txt).toLocaleDateString("en-US",{weekday:"short"});
html+=`<div class="forecast-card">
<p>${day}</p>
<p>${Math.round(item.main.temp)}°</p>
</div>`;
}
document.getElementById("forecastBox").innerHTML=html;
});
}

/* ⭐ FAVORITE */
function toggleFavorite(){
let fav=JSON.parse(localStorage.getItem("fav"))||[];

if(fav.includes(currentCity)){
fav=fav.filter(c=>c!==currentCity);
}else{
fav.push(currentCity);
}

localStorage.setItem("fav",JSON.stringify(fav));
updateFavBtn();
showFavorites();
}

function updateFavBtn(){
let fav=JSON.parse(localStorage.getItem("fav"))||[];
let btn=document.getElementById("favBtn");
if(!btn) return;

btn.classList.toggle("active",fav.includes(currentCity));
}

function showFavorites(){
let fav=JSON.parse(localStorage.getItem("fav"))||[];
let html="";
fav.forEach(c=>{
html+=`<span onclick="searchCity('${c}')">⭐ ${c}</span>`;
});
document.getElementById("favoriteList").innerHTML=html;
}

/* 🕘 RECENT */
function saveRecent(city){
let h=JSON.parse(localStorage.getItem("his"))||[];
if(!h.includes(city)) h.unshift(city);
h=h.slice(0,5);
localStorage.setItem("his",JSON.stringify(h));
showRecent();
}

function showRecent(){
let h=JSON.parse(localStorage.getItem("his"))||[];
let html="";
h.forEach(c=>{
html+=`<span onclick="searchCity('${c}')">${c}</span>`;
});
document.getElementById("recentSearch").innerHTML=html;
}

function searchCity(city){
document.getElementById("cityInput").value=city;
getWeather();
}

/* 🌙 DARK MODE */
function toggleDark(){
document.body.classList.toggle("dark");

const btn=document.getElementById("themeBtn");
btn.innerText=document.body.classList.contains("dark")?"☀️":"🌙";
}

/* 🌡 UNIT */
function toggleUnit(){
const btn=document.getElementById("unitBtn");

if(unit==="metric"){
unit="imperial";
btn.innerText="°F";
}else{
unit="metric";
btn.innerText="°C";
}

if(currentCity){
getWeather();
}
}

/* 🔍 AUTO SUGGEST */
const input=document.getElementById("cityInput");
const suggestionBox=document.getElementById("suggestions");

input.addEventListener("input",function(){

let q=input.value;

if(q.length<2){
suggestionBox.innerHTML="";
return;
}

fetch(`${GEO_API}?q=${q}&limit=5&appid=${API_KEY}`)
.then(res=>res.json())
.then(data=>{
let html="";
data.forEach(c=>{
html+=`<div onclick="selectCity('${c.name}')">${c.name}, ${c.country}</div>`;
});
suggestionBox.innerHTML=html;
});
});

function selectCity(city){
input.value=city;
suggestionBox.innerHTML="";
getWeather();
}

document.addEventListener("click",(e)=>{
if(!e.target.closest(".search-box")){
suggestionBox.innerHTML="";
}
});

/* 🚀 LOAD */
window.onload=function(){

showRecent();
showFavorites();

document.getElementById("themeBtn").innerText="🌙";
document.getElementById("unitBtn").innerText="°C";

let last=localStorage.getItem("lastCity");

if(last){
document.getElementById("cityInput").value=last;
getWeather();
}else{
getLocationWeather();
}

};