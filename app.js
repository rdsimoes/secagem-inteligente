const API_KEY = "bff92e3f993b20c6dad724d250a57bf7";
function getLocation(){
    navigator.geolocation.getCurrentPosition(pos=>{
        fetchWeather(pos.coords.latitude,pos.coords.longitude);
    });
}
function fetchWeather(lat,lon){
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    .then(r=>r.json())
    .then(data=>{
        localStorage.setItem("weather", JSON.stringify(data));
        analyze(data);
    });
}
window.onload = ()=>{
    if("serviceWorker" in navigator){
        navigator.serviceWorker.register("service-worker.js");
    }
    const saved = localStorage.getItem("weather");
    if(saved){
        analyze(JSON.parse(saved));
    }
}
function score(i){
    let s=0;
    s+=i.main.temp*1.5;
    s-=i.main.humidity*0.5;
    s+=i.wind.speed*2;
    s-=i.clouds.all*0.2;
    if(i.weather[0].main.includes("Rain")) s-=60;
    if(i.weather[0].main.includes("Clear")) s+=25;
    return s;
}
function dryingTime(score, type){
    let base = 5;
    let factor = type;
    let speed = Math.max(1, score/20);
    return (base*factor)/speed;
}
function analyze(data){
    const hoursDiv = document.getElementById("hours");
    hoursDiv.innerHTML="";
    let best=null, bestScore=-999;
    let labels=[], scores=[];
    data.list.slice(0,16).forEach(i=>{
        let s = score(i);
        if(s>bestScore){
            bestScore=s;
            best=i;
        }
        let time = new Date(i.dt*1000).getHours()+":00";
        labels.push(time);
        scores.push(s);
        let div=document.createElement("div");
        div.className="hour "+(s>40?"good":s>15?"ok":"bad");
        div.innerHTML=`${time}<br>${Math.round(s)}`;
        hoursDiv.appendChild(div);
    });
    let bestHour = new Date(best.dt*1000).getHours();
    document.getElementById("best").innerHTML = "👉 Melhor hora: "+bestHour+":00";
    let type = document.getElementById("clothes").value;
    let time = dryingTime(bestScore,type).toFixed(1);
    document.getElementById("timeEstimate").innerHTML = "⏱️ Tempo estimado: "+time+" horas";
    notify(bestHour);
    drawChart(labels,scores);
}
function drawChart(labels,data){
    new Chart(document.getElementById("chart"),{
        type:"line",
        data:{
            labels:labels,
            datasets:[{data:data}]
        }
    });
}
function notify(hour){
    if(Notification.permission==="granted"){
        new Notification("Hora ideal para secar roupa!",{ body:"Melhor hora: "+hour+":00" });
    } else {
        Notification.requestPermission();
    }
}