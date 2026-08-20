(() => {
  const boardEl = document.getElementById("board");
  const turnEl = document.getElementById("turnText");
  const statusEl = document.getElementById("status");
  const historyEl = document.getElementById("history");
  const modalEl = document.getElementById("modal");
  const winnerTitleEl = document.getElementById("winnerTitle");
  const winnerTextEl = document.getElementById("winnerText");

  const symbols = {
    white:{king:"♔",queen:"♕",rook:"♖",bishop:"♗",knight:"♘",pawn:"♙"},
    black:{king:"♚",queen:"♛",rook:"♜",bishop:"♝",knight:"♞",pawn:"♟"}
  };
  const names={king:"Raja",queen:"Ratu",rook:"Benteng",bishop:"Gajah",knight:"Kuda",pawn:"Pion"};

  let board, turn, selected, moves, over;

  function makeBoard(){
    const back=["rook","knight","bishop","queen","king","bishop","knight","rook"];
    return [
      back.map(type=>({type,color:"black"})),
      Array.from({length:8},()=>({type:"pawn",color:"black"})),
      ...Array.from({length:4},()=>Array(8).fill(null)),
      Array.from({length:8},()=>({type:"pawn",color:"white"})),
      back.map(type=>({type,color:"white"}))
    ];
  }

  function start(){
    board=makeBoard(); turn="white"; selected=null; moves=[]; over=false;
    historyEl.innerHTML=""; modalEl.classList.add("hidden");
    statusEl.textContent="Pilih salah satu bidak Putih.";
    render();
  }

  function inside(r,c){return r>=0&&r<8&&c>=0&&c<8}
  function render(){
    boardEl.innerHTML="";
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const sq=document.createElement("button");
      sq.type="button"; sq.className="square "+(((r+c)%2===0)?"light":"dark");
      if(selected&&selected.r===r&&selected.c===c)sq.classList.add("selected");
      const m=moves.find(x=>x.r===r&&x.c===c);
      if(m)sq.classList.add(board[r][c]?"capture":"move");
      const p=board[r][c];
      if(p){
        const span=document.createElement("span");
        span.className="piece "+(p.color==="white"?"white-piece":"black-piece");
        span.textContent=symbols[p.color][p.type]; sq.appendChild(span);
      }
      sq.addEventListener("click",()=>click(r,c));
      boardEl.appendChild(sq);
    }
    turnEl.textContent=turn==="white"?"⚪ Pemain Putih":"⚫ Pemain Hitam";
  }

  function click(r,c){
    if(over)return;
    const p=board[r][c];
    if(!selected){
      if(p&&p.color===turn) choose(r,c);
      else statusEl.textContent="Pilih bidak milik pemain yang sedang mendapat giliran.";
      return;
    }
    if(p&&p.color===turn){choose(r,c);return;}
    if(moves.some(m=>m.r===r&&m.c===c)){move(r,c);return;}
    selected=null;moves=[];statusEl.textContent="Pilihan dibatalkan.";render();
  }

  function choose(r,c){
    selected={r,c}; moves=getMoves(r,c,board[r][c]);
    statusEl.textContent=`${names[board[r][c].type]} dipilih. ${moves.length} langkah tersedia.`;
    render();
  }

  function add(r,c,p,out){
    if(!inside(r,c))return;
    const t=board[r][c];
    if(!t||t.color!==p.color)out.push({r,c});
  }
  function lines(r,c,p,out,dirs){
    for(const [dr,dc] of dirs){
      let nr=r+dr,nc=c+dc;
      while(inside(nr,nc)){
        const t=board[nr][nc];
        if(!t)out.push({r:nr,c:nc});
        else {if(t.color!==p.color)out.push({r:nr,c:nc});break;}
        nr+=dr;nc+=dc;
      }
    }
  }
  function getMoves(r,c,p){
    const out=[];
    if(p.type==="pawn"){
      const d=p.color==="white"?-1:1, start=p.color==="white"?6:1;
      if(inside(r+d,c)&&!board[r+d][c]){
        out.push({r:r+d,c});
        if(r===start&&!board[r+2*d][c])out.push({r:r+2*d,c});
      }
      for(const dc of [-1,1]){
        const nr=r+d,nc=c+dc;
        if(inside(nr,nc)&&board[nr][nc]&&board[nr][nc].color!==p.color)out.push({r:nr,c:nc});
      }
    } else if(p.type==="rook") lines(r,c,p,out,[[1,0],[-1,0],[0,1],[0,-1]]);
    else if(p.type==="bishop") lines(r,c,p,out,[[1,1],[1,-1],[-1,1],[-1,-1]]);
    else if(p.type==="queen") lines(r,c,p,out,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
    else if(p.type==="knight") for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr,c+dc,p,out);
    else if(p.type==="king") for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(r+dr,c+dc,p,out);
    return out;
  }

  function move(tr,tc){
    const {r:fr,c:fc}=selected, p=board[fr][fc], captured=board[tr][tc];
    board[tr][tc]=p; board[fr][fc]=null;
    if(p.type==="pawn"&&(tr===0||tr===7))p.type="queen";
    const from=String.fromCharCode(65+fc)+(8-fr), to=String.fromCharCode(65+tc)+(8-tr);
    const li=document.createElement("li"); li.textContent=`${names[p.type]} ${from} ${captured?"×":"→"} ${to}`; historyEl.appendChild(li);
    historyEl.scrollTop=historyEl.scrollHeight;
    selected=null;moves=[];
    if(captured&&captured.type==="king"){
      over=true; render();
      const who=p.color==="white"?"Pemain Putih":"Pemain Hitam";
      winnerTitleEl.textContent=who+" Menang!"; winnerTextEl.textContent="Raja lawan berhasil ditangkap.";
      modalEl.classList.remove("hidden"); return;
    }
    turn=turn==="white"?"black":"white";
    statusEl.textContent="Giliran "+(turn==="white"?"Pemain Putih.":"Pemain Hitam.");
    render();
  }

  document.getElementById("restartBtn").addEventListener("click",start);
  document.getElementById("playAgainBtn").addEventListener("click",start);
  document.getElementById("clearBtn").addEventListener("click",()=>historyEl.innerHTML="");
  start();
})();