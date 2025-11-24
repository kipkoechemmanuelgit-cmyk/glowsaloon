// main.js — app logic (works for index, queue, admin pages)
// Uses Firebase modular SDK loaded dynamically
(async function(){
  const SDKs = [
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js'
  ];
  for(const s of SDKs){
    await loadScript(s);
  }

  const firebaseConfig = window.__FIREBASE_CONFIG;
  if(!firebaseConfig || firebaseConfig.apiKey.includes('REPLACE')){
    console.warn('Firebase config is not set. Instructions in README.');
  }

  // Initialize Firebase (compat for simpler code)
  if(window.firebase && !firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();

  // SERVICE LIST (edit durations in minutes)
  const SERVICES = [
    {id:'haircut', name:'Haircut', duration:20},
    {id:'braids', name:'Braids', duration:180},
    {id:'manicure', name:'Manicure', duration:45},
    {id:'beard', name:'Beard Trim', duration:15}
  ];

  // Utility: load external script
  function loadScript(src){
    return new Promise((res,rej)=>{
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // Common helpers
  function $(id){return document.getElementById(id);}

  // PAGE: index.html
  if(document.body && document.querySelector('#joinForm')){
    const serviceSel = $('service');
    SERVICES.forEach(s=>{
      const opt = document.createElement('option');
      opt.value = s.id; opt.textContent = s.name + ' ('+s.duration+'m)';
      serviceSel.appendChild(opt);
    });

    $('joinForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = $('name').value.trim();
      const phone = $('phone').value.trim();
      const service = $('service').value;
      if(!name||!phone) return alert('Fill name and phone');

      // create queue entry in Firestore
      try{
        const docRef = await db.collection('queue').add({
          name, phone, service, status: 'waiting',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // store local reference so user can open their status
        localStorage.setItem('myQueueDocId', docRef.id);
        // store name for convenience
        localStorage.setItem('myName', name);
        alert('Joined queue! Opening your queue status.');
        location.href = 'queue.html';
      }catch(err){
        console.error(err);
        alert('Failed to join queue. Is Firebase configured? See README.');
      }
    });

    $('viewQueue').addEventListener('click', ()=>location.href='queue.html');
  }

  // PAGE: queue.html
  if(document.body && document.querySelector('#statusCard')){
    const details = $('details');
    const actions = $('actions');
    const heading = $('statusHeading');
    let myId = localStorage.getItem('myQueueDocId');
    if(!myId){
      heading.textContent = 'No active queue found';
      details.innerHTML = '<p class="small">You have not joined the queue on this device. Return to home to join.</p>';
      actions.innerHTML = '<p><a href="index.html">Go to Home</a></p>';
      return;
    }

    // realtime listener for queue collection
    db.collection('queue').orderBy('createdAt').onSnapshot(snapshot=>{
      const docs = [];
      snapshot.forEach(d=>docs.push({id:d.id, ...d.data()}));
      const waiting = docs.filter(d=>d.status==='waiting' || d.status==='serving');
      const my = docs.find(d=>d.id === myId);
      if(!my){
        heading.textContent = 'Your booking was removed';
        details.innerHTML = '<p class="small">It seems your queue entry no longer exists.</p>';
        actions.innerHTML = '<p><a href="index.html">Join again</a></p>';
        return;
      }

      const myIndex = waiting.findIndex(d=>d.id===myId);
      if(my.status === 'serving'){
        heading.textContent = 'You are being served now';
      }else if(my.status === 'completed'){
        heading.textContent = 'You were served — thank you!';
      }else{
        heading.textContent = 'You are in the queue';
      }

      // estimate wait time: sum durations of people ahead
      let eta = 0;
      for(let i=0;i<myIndex;i++){
        const sId = waiting[i].service;
        const s = SERVICES.find(x=>x.id===sId);
        eta += (s? s.duration : 15);
      }

      details.innerHTML = `
        <p><strong>Name:</strong> ${my.name}</p>
        <p><strong>Phone:</strong> ${my.phone}</p>
        <p><strong>Service:</strong> ${SERVICES.find(s=>s.id===my.service)?.name || my.service}</p>
        <p><strong>Position:</strong> ${myIndex+1}</p>
        <p><strong>Estimated wait:</strong> ${eta} minutes</p>
        <p class="small">Status: ${my.status}</p>
      `;

      actions.innerHTML = '';
      if(my.status === 'waiting'){
        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Leave Queue';
        btnCancel.onclick = async ()=> {
          if(!confirm('Leave queue?')) return;
          await db.collection('queue').doc(myId).delete();
          localStorage.removeItem('myQueueDocId');
          location.href = 'index.html';
        };
        actions.appendChild(btnCancel);
      }else if(my.status === 'serving'){
        actions.innerHTML = '<p class="small">Please wait while you are being served.</p>';
      }else{
        actions.innerHTML = '<p class="small">Thanks! You can return to home.</p>';
      }
    }, err=>{
      console.error(err);
      details.innerHTML = '<p class="small">Realtime error. Check Firebase setup.</p>';
    });
  }

  // PAGE: admin.html
  if(document.body && document.querySelector('#queueList')){
    const list = $('queueList');
    const refreshBtn = $('refreshBtn');

    function render(docs){
      list.innerHTML = '';
      const waiting = docs.filter(d=>d.status==='waiting').sort((a,b)=>{
        if(!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.seconds - b.createdAt.seconds;
      });
      const serving = docs.find(d=>d.status==='serving');

      if(serving){
        const el = document.createElement('div');
        el.className = 'card';
        el.innerHTML = '<h3>Currently serving</h3>';
        el.innerHTML += `<div class="item"><div><strong>${serving.name}</strong><div class="small">${serving.service} • ${serving.phone}</div></div><div><button data-id="${serving.id}" class="completeBtn">Complete</button></div></div>`;
        list.appendChild(el);
      }

      const container = document.createElement('div');
      container.className = 'card';
      container.innerHTML = '<h3>Waiting list</h3>';
      if(waiting.length===0) container.innerHTML += '<p class="small">No one waiting</p>';
      waiting.forEach((w, idx)=>{
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `<div><strong>${idx+1}. ${w.name}</strong><div class="small">${w.service} • ${w.phone}</div></div>
        <div>
          <button data-id="${w.id}" class="serveBtn">Serve</button>
          <button data-id="${w.id}" class="removeBtn">Remove</button>
        </div>`;
        container.appendChild(div);
      });
      list.appendChild(container);
    }

    // Realtime listener
    db.collection('queue').orderBy('createdAt').onSnapshot(snapshot=>{
      const docs = [];
      snapshot.forEach(d=>{
        const data = d.data();
        docs.push({id:d.id, ...data});
      });
      render(docs);
    }, err=>{
      list.innerHTML = '<p class="small">Realtime error - check Firebase setup.</p>';
      console.error(err);
    });

    // Event delegation
    list.addEventListener('click', async (e)=>{
      const serveBtn = e.target.closest('.serveBtn');
      const removeBtn = e.target.closest('.removeBtn');
      const completeBtn = e.target.closest('.completeBtn');
      if(serveBtn){
        const id = serveBtn.dataset.id;
        // mark any previous serving as completed
        const servingSnap = await db.collection('queue').where('status','==','serving').get();
        const batch = db.batch();
        servingSnap.forEach(s=> batch.update(s.ref, {status:'completed', completedAt: firebase.firestore.FieldValue.serverTimestamp()}));
        // set selected to serving
        const ref = db.collection('queue').doc(id);
        batch.update(ref, {status:'serving', servingAt: firebase.firestore.FieldValue.serverTimestamp()});
        await batch.commit();
      }else if(removeBtn){
        const id = removeBtn.dataset.id;
        if(confirm('Remove this person from queue?')){
          await db.collection('queue').doc(id).delete();
        }
      }else if(completeBtn){
        const id = completeBtn.dataset.id;
        await db.collection('queue').doc(id).update({status:'completed', completedAt: firebase.firestore.FieldValue.serverTimestamp()});
      }
    });

    refreshBtn.addEventListener('click', ()=> location.reload());
  }

})();
