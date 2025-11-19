const API = window.location.origin + '/data';
const UPDATE = window.location.origin + '/update';
const POLL_MS = 2000;

// Map init
var map = L.map('map').setView([20.5937,78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var marker = L.marker([20.5937,78.9629]).addTo(map);

// Chart init
const ctx = document.getElementById('alcoholChart').getContext('2d');
const alcoholChart = new Chart(ctx,{type:'line',data:{labels:[],datasets:[{label:'Alcohol',data:[],tension:0.3,borderColor:'#00d4ff',borderWidth:2,pointRadius:0}]},options:{animation:{duration:300},scales:{y:{min:0,max:4095}}}});

// logs
let logs = [];

async function refresh(){
  try{
    const r = await fetch(API);
    const j = await r.json();
    document.getElementById('helmet').innerText = j.helmet==0?'Worn':'Not Worn';
    document.getElementById('alcohol').innerText = j.alcohol;
    document.getElementById('accident').innerText = j.accident==1?'⚠ ACTIVE':'Safe';
    document.getElementById('engine').innerText = j.engine==1?'OFF':'ON';

    if(j.lat && j.lng){
      marker.setLatLng([j.lat,j.lng]);
      map.setView([j.lat,j.lng], 14);
    }

    alcoholChart.data.labels.push('');
    alcoholChart.data.datasets[0].data.push(j.alcohol);
    if(alcoholChart.data.labels.length>40){alcoholChart.data.labels.shift();alcoholChart.data.datasets[0].data.shift();}
    alcoholChart.update();

    const t = new Date((j.timestamp||Date.now())*1000).toLocaleString();
    const entry = `${t} | A:${j.alcohol} H:${j.helmet} ACC:${j.accident} LOC:${j.lat},${j.lng}`;
    logs.unshift(entry);
    if(logs.length>200) logs.pop();
    document.getElementById('logs').innerText = logs.join('\\n\\n');

    if(j.accident==1){
      document.getElementById('card-accident').style.boxShadow='0 0 24px 6px rgba(255,77,77,0.35)';
      try{ navigator.vibrate && navigator.vibrate([400,200,400]); }catch(e){}
    } else {
      document.getElementById('card-accident').style.boxShadow='';
    }

  }catch(e){ console.error(e); }
}

setInterval(refresh,POLL_MS);
refresh();

async function sendCommand(key,val){
  // For demo: post small update; ESP must poll or server implement command channel (future)
  try{
    const body = {};
    body[key] = val;
    // include API key param? For demo we use same update endpoint (protected)
    await fetch(UPDATE,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-API-KEY': prompt('Enter API key to send command')},
      body: JSON.stringify(body)
    });
    alert('Command sent (demo)');
  }catch(e){ alert('send failed'); }
}
