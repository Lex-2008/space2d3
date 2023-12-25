(()=>{var u=class{static id;get mytype(){return this.constructor}get typename(){return this.mytype.id}toJSON(){return{type:this.typename}}static fromJSON(e,n){return new e}};function T(t){let e=b[t.type];return e.fromJSON(e,t)}var b={};function h(t,e){b[e]=t,t.id=e}var B=class extends u{},y=class extends B{},J=class extends y{};h(J,"Rocket");var _=class extends y{};h(_,"Fuel");var k=class extends u{cellName="";onEnter(e){}},d=class extends k{},v=class extends d{};h(v,"Passage");var f=class extends d{};h(f,"Ballast");var H=class t extends d{original="";toJSON(){return{type:this.typename,original:this.original}}static fromJSON(e,n){let o=new t;return o.original=n.original,o}};h(H,"Debris");var S=class extends k{},O=class t extends S{cargo=[];toJSON(){return{type:this.typename,cargo:this.cargo.map(e=>e.toJSON())}}static fromJSON(e,n){let o=new t;return o.cargo=n.cargo.map(s=>T(s)),o}onEnter(e){e.getElementsByTagName("ul")[0].innerHTML=this.cargo.map(n=>`<li>${n.typename}</li>`).join(""),e.getElementsByClassName("CargoBay_Empty")[0].style.display=this.cargo.length==0?"":"none",e.getElementsByClassName("CargoBay_NonEmpty")[0].style.display=this.cargo.length==0?"none":""}};h(O,"CargoBay");function N(t,e){return t>e&&([t,e]=[e,t]),Math.floor(Math.random()*(e-t+1))+t}function D(t){return t[Math.floor(Math.random()*t.length)]}var g=class t{isAlien=!1;rows=[];offsets=[];toJSON(){return{isAlien:this.isAlien,offsets:this.offsets,rows:this.rows.map(e=>e.map(n=>n.toJSON()))}}static fromJSON(e){let n=new t;return n.isAlien=e.isAlien,n.offsets=e.offsets,n.rows=e.rows.map(o=>o.map(s=>T(s))),n}get gridSize(){if(this.isAlien)return{x0:0,x1:0,y0:0,y1:0};{let e=0,n=0;for(let o=0;o<this.rows.length;o++)e=Math.max(e,this.rows[o].length-this.offsets[o]),n=Math.max(n,this.offsets[o]);return{x0:0,x1:this.rows.length,y0:e,y1:n}}}rowToXY(e,n){return this.isAlien?{x:0,y:0}:n>=this.offsets[e]?{x:e,y:1+(n-this.offsets[e])}:{x:e,y:n-this.offsets[e]}}get passage(){return this.isAlien?{x:0,y:0,w:0,h:0}:{x:0,y:0,w:this.rows.length,h:1}}oppositeComponent(e){for(let n=0;n<=this.rows.length;n++){let o=this.rows[n].indexOf(e);if(o>=0)return this.rows[this.rows.length-1-n][o]}}static randomShip(e){let o=Object.values(b).filter(i=>i.prototype instanceof S),s=Object.values(b).filter(i=>i.prototype instanceof y),r=new t;r.rows=[[],[],[],[]],r.offsets=[0,0,0,0];for(let i=0;i<e;i++){let m=N(0,3),p=D(o),M=new p;if(M instanceof O){let z=N(0,4);for(let X=0;X<z;X++){let $=D(s);M.cargo.push(new $)}}r.rows[m].push(M)}for(let i=0;i<r.rows.length;i++)r.offsets[i]=N(0,r.rows[i].length);return r.balanceBallast(),r}balanceBallast(){if(!this.isAlien){let n=this.rows.length-1;for(var e=0;e<=n;e++)for(;this.offsets[e]<this.offsets[n-e];)this.rows[e].unshift(new f),this.offsets[e]++;for(var e=0;e<=n;e++)for(;this.rows[e].length<this.rows[n-e].length;)this.rows[e].push(new f);for(var e=0;e<=n;e++)for(;this.rows[e][0]instanceof f&&this.rows[n-e][0]instanceof f;)this.rows[e].shift(),this.rows[n-e].shift(),this.offsets[e]--,this.offsets[n-e]++;for(var e=0;e<=n;e++)for(;this.rows[e].at(-1)instanceof f&&this.rows[n-e].at(-1)instanceof f;)this.rows[e].pop(),this.rows[n-e].pop()}}};var a=50,w=5;function W(t,e,n,o,s,r){o.isAlien?t.rect(e*a,n*a+w,a,a-2*w):t.rect(e*a+w,n*a,a-2*w,a),t.strokeStyle="white",t.fillStyle="white",t.stroke(),t.textBaseline="top",t.fillText(s.cellName||"",e*a+w,n*a),t.fillText(s.typename[0],e*a+w,n*a+16),r&&(r.map[e][n].canBeHere=!0,r.map[e][n].canGoX=o.isAlien,r.map[e][n].canGoY=!o.isAlien,r.map[e][n].ship=o,r.map[e][n].component=s)}function I(t,e,n,o,s){let r=o.passage;if(t.rect((e+r.x)*a,(n+r.y)*a,r.w*a,r.h*a),t.strokeStyle="white",t.fillStyle="white",t.stroke(),t.textBaseline="top",s){let i=new v;for(let m=0;m<r.w;m++)for(let p=0;p<r.h;p++)s.map[m+e][p+n].canBeHere=!0,s.map[m+e][p+n].canGoX=!0,s.map[m+e][p+n].canGoY=!0,s.map[m+e][p+n].ship=o,s.map[m+e][p+n].component=i}}function Y(t,e,n,o,s){for(let r=0;r<o.rows.length;r++)for(let i=0;i<o.rows[r].length;i++){let m=o.rows[r][i],p=o.rowToXY(r,i);m.cellName=String.fromCharCode(65+r)+p.y,W(t,e+p.x,n-p.y,o,m,s)}I(t,e,n,o,s)}var L=class{canBeHere=!1;canGoX=!1;canGoY=!1;ship;component},C=class{map=[];constructor(e,n){for(let o=0;o<=e;o++){this.map[o]=[];for(let s=0;s<=n;s++)this.map[o][s]=new L}}},E=class{x;y;map;box;canvas;onEnter;goX(e){return!this.map.map[this.x][this.y].canGoX||!this.map.map[this.x+e][this.y].canBeHere?!1:(this.x+=e,this.reposition(),this.onEnter(this.map.map[this.x][this.y].component),!0)}goY(e){return!this.map.map[this.x][this.y].canGoY||!this.map.map[this.x][this.y+e].canBeHere?!1:(this.y+=e,this.reposition(),this.onEnter(this.map.map[this.x][this.y].component),!0)}goUp(){return this.goY(-1)}goDn(){return this.goY(1)}goLt(){return this.goX(-1)}goRt(){return this.goX(1)}reposition(){let e=(this.x+.5)*a,o=this.box.offsetWidth/2-e;this.canvas.style.left=o+"px";let s=(this.y+.5)*a,i=this.box.offsetHeight/2-s;this.canvas.style.top=i+"px"}};function c(t){let e=document.getElementById(t);if(!e)throw ReferenceError(`element ${t} not found`);return e}function we(t){let e=c(t);if(!(e instanceof HTMLInputElement))throw ReferenceError(`element ${t} is not input`);return e}(location.hostname=="localhost"||location.hostname=="127.0.0.1")&&new EventSource("/esbuild").addEventListener("change",()=>location.reload());var x=g.randomShip(1),j=new C(0,0),l=new E;l.box=c("canvasBox");var A=c("myCanvas"),P=A.getContext("2d");l.canvas=A;l.onEnter=U;function G(t){let e=t.gridSize,n=e.x0+e.x1+1,o=e.y0+e.y1+2;j=new C(n,o),A.width=a*(n+1),A.height=a*(o+1),Y(P,e.x0+1,e.y0+1,t,j),l.map=j,l.x=e.x0+1,l.y=e.y0+1,l.reposition(),l.onEnter(l.map.map[l.x][l.y].component)}function R(){x=g.randomShip(35),console.log(x),G(x)}function F(){localStorage.space2d3_1_ship=JSON.stringify(x.toJSON())}function q(){x=g.fromJSON(JSON.parse(localStorage.space2d3_1_ship)),G(x)}R();c("save").onclick=F;c("load").onclick=q;c("random").onclick=R;window.onkeypress=t=>{switch(t.key){case"w":l.goUp();break;case"a":l.goLt();break;case"s":l.goDn();break;case"d":l.goRt();break}};function U(t){if(!t)return;c("currentComponent").innerHTML=`#${t.typename} {display:block}`;let e=c(t.typename);t.cellName?c("componentLegend").innerText=`${t.cellName}: ${t.typename}`:c("componentLegend").innerText=`${t.typename}`,t.onEnter(e)}})();
//# sourceMappingURL=script.js.map