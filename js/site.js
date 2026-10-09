/* My MCQs — single-page site logic (PPSC-only, guest mode) */
(function(){
  "use strict";

  function el(id){ return document.getElementById(id); }

  /* ---------- mobile menu + FAQ ---------- */
  var btn = el("menuBtn"), nav = el("mainNav");
  if(btn && nav){
    btn.addEventListener("click", function(){ nav.classList.toggle("open"); });
    nav.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ nav.classList.remove("open"); });
    });
  }
  document.querySelectorAll(".faq-item").forEach(function(item){
    var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
    if(!q || !a) return;
    q.addEventListener("click", function(){
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function(o){
        o.classList.remove("open"); o.querySelector(".faq-a").style.maxHeight = null;
      });
      if(!open){ item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });

  /* ---------- Supabase helpers ---------- */
  var sb = null;
  window.MT = {
    supabase: function(){
      if(sb) return sb;
      if(typeof supabase === "undefined") return null;
      if(!window.SUPABASE_URL || SUPABASE_URL.indexOf("YOUR_PROJECT") === 0) return null;
      sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return sb;
    },
    isConfigured: function(){
      return typeof SUPABASE_URL !== "undefined" && SUPABASE_URL.indexOf("YOUR_PROJECT") !== 0;
    },
    shuffle: function(arr){
      var a = arr.slice();
      for(var i = a.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    esc: function(s){
      return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
        return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
      });
    }
  };

  var SUBJECTS = [
    {slug:"computer-science", name:"Computer Science", icon:"💻", desc:"Fundamentals, hardware, software and IT concepts."},
    {slug:"english", name:"English", icon:"🔤", desc:"Grammar, vocabulary, synonyms, antonyms, comprehension."},
    {slug:"urdu", name:"Urdu", icon:"📖", desc:"Urdu adab, grammar and classical literature."},
    {slug:"islamiyat", name:"Islamiyat", icon:"🕌", desc:"Seerah, pillars of Islam and Islamic history."},
    {slug:"everyday-science", name:"Everyday Science", icon:"🔬", desc:"Physics, chemistry and biology basics."},
    {slug:"pak-study", name:"Pak Study", icon:"🇵🇰", desc:"History, geography and constitution of Pakistan."},
    {slug:"general-knowledge", name:"General Knowledge", icon:"🌍", desc:"World GK, capitals, organizations, personalities."},
    {slug:"current-affairs", name:"Current Affairs", icon:"📰", desc:"National and international current affairs."},
    {slug:"basic-mathematics", name:"Basic Mathematics", icon:"➗", desc:"Arithmetic, algebra and problem solving for PPSC."},
    {slug:"past-papers", name:"Past Papers", icon:"📝", desc:"Solved PPSC past papers, structured mocks."}
  ];
  var EXAM = "ppsc"; // this whole site is PPSC-only
  var COLS = "id,question,option_a,option_b,option_c,option_d,correct_option,explanation,subject_slug,paper_id";
  var CHUNK = 1000;

  /* Fetch EVERY matching MCQ in 1000-row chunks (no 400 cap) */
  function fetchAll(subject, cb){
    if(!MT.isConfigured()){ cb([]); return; }
    var all = [], offset = 0;
    (function next(){
      var q = MT.supabase().from("mcqs").select(COLS)
        .or("exam_body.eq."+EXAM+",exam_body.is.null")
        .order("id", {ascending:true})
        .range(offset, offset + CHUNK - 1);
      if(subject) q = q.eq("subject_slug", subject);
      q.then(function(res){
        if(res.error){ cb(all); return; }
        var rows = res.data || [];
        all = all.concat(rows);
        if(rows.length === CHUNK){ offset += CHUNK; next(); }
        else cb(all);
      }).catch(function(){ cb(all); });
    })();
  }

  function toOptions(m){
    return MT.shuffle([
      {k:"A", t:m.option_a}, {k:"B", t:m.option_b},
      {k:"C", t:m.option_c}, {k:"D", t:m.option_d}
    ]);
  }

  /* ---------- hero stats + subject cards ---------- */
  function ppscOnly(r){ return r.exam_body === EXAM || !r.exam_body; }
  if(MT.isConfigured()){
    MT.supabase().from("mcqs").select("subject_slug,exam_body").then(function(res){
      if(!res.data) return;
      var counts = {}, total = 0;
      res.data.forEach(function(r){
        if(ppscOnly(r)){ total++; counts[r.subject_slug] = (counts[r.subject_slug] || 0) + 1; }
      });
      var st = el("statMcqs");
      if(st) st.textContent = total.toLocaleString("en-US") + "+";
      renderSubjects(counts);
    }).catch(function(){ renderSubjects({}); });
  } else { renderSubjects({}); }

  function renderSubjects(counts){
    var grid = el("subjectGrid");
    if(!grid) return;
    grid.innerHTML = "";
    SUBJECTS.forEach(function(s){
      var n = counts[s.slug] || 0;
      var d = document.createElement("div");
      d.className = "scard";
      d.innerHTML = '<div class="emo">'+s.icon+'</div><h3>'+MT.esc(s.name)+'</h3><p>'+MT.esc(s.desc)+'</p>'
        + '<span class="count'+(n?"":" zero")+'">'+(n ? n.toLocaleString("en-US")+" MCQs" : "Coming soon")+'</span>'
        + '<button class="btn '+(n ? "btn-blue" : "btn-ghost-b")+'" data-subj="'+s.slug+'"'+(n?"":" disabled style='opacity:.45'")+'>Practice →</button>';
      grid.appendChild(d);
    });
    grid.querySelectorAll("[data-subj]").forEach(function(b){
      b.addEventListener("click", function(){
        loadPractice(b.getAttribute("data-subj"));
        document.getElementById("practice").scrollIntoView({behavior:"smooth"});
      });
    });
    // subject pills for practice
    var pills = el("practicePills");
    if(pills){
      pills.innerHTML = "";
      SUBJECTS.forEach(function(s){
        var n = counts[s.slug] || 0;
        if(!n) return;
        var p = document.createElement("button");
        p.className = "spill"; p.textContent = s.name; p.setAttribute("data-p", s.slug);
        p.addEventListener("click", function(){ loadPractice(s.slug); });
        pills.appendChild(p);
      });
    }
    // upload subject dropdown
    var sel = el("f_subject");
    if(sel){
      SUBJECTS.forEach(function(s){
        var o = document.createElement("option");
        o.value = s.slug; o.textContent = s.name;
        sel.appendChild(o);
      });
    }
  }

  /* ---------- PRACTICE ---------- */
  var curSubject = null;
  function setActivePill(slug){
    document.querySelectorAll("#practicePills .spill").forEach(function(p){
      p.classList.toggle("active", p.getAttribute("data-p") === slug);
    });
  }
  function loadPractice(slug){
    curSubject = slug;
    setActivePill(slug);
    var meta = SUBJECTS.find(function(s){ return s.slug === slug; });
    el("quizTitle").textContent = (meta ? meta.name : "Practice") + " — Practice (PPSC)";
    var box = el("quizBox");
    box.innerHTML = '<div class="empty"><h3>Loading questions…</h3><p>Fetching the full question bank.</p></div>';
    fetchAll(slug, function(data){
      if(!data.length){
        box.innerHTML = '<div class="empty"><h3>MCQs coming soon</h3><p>Questions for this subject are being added.</p></div>';
        return;
      }
      runPractice(MT.shuffle(data), meta ? meta.name : slug);
    });
  }

  function runPractice(questions, subjectName){
    var box = el("quizBox");
    var perPage = 20;
    var totalPages = Math.max(1, Math.ceil(questions.length / perPage));
    var page = 1;
    var answers = {};
    var qopts = questions.map(function(m){ return toOptions(m); }); // shuffle options once

    function score(){
      var a = 0, c = 0;
      questions.forEach(function(m, qi){
        if(answers[qi]){ a++; if(answers[qi] === m.correct_option) c++; }
      });
      return {a:a, c:c};
    }
    function lockVisual(card, qi){
      var m = questions[qi], pick = answers[qi];
      card.querySelectorAll(".opt").forEach(function(x){
        x.disabled = true;
        var k = x.getAttribute("data-k");
        if(k === m.correct_option){ x.classList.add("correct"); x.querySelector(".tick").textContent = "✓"; }
        else if(k === pick){ x.classList.add("wrong"); x.querySelector(".tick").textContent = "✗"; }
      });
      var ex = card.querySelector(".explain");
      ex.innerHTML = "<strong>Explanation:</strong> " + MT.esc(m.explanation || ("Correct answer is option " + m.correct_option + "."));
      ex.classList.add("show");
    }
    function pageNums(cur, total){
      var out = [];
      if(total <= 9){ for(var i=1;i<=total;i++) out.push(i); }
      else if(cur <= 5){ for(var i=1;i<=6;i++) out.push(i); out.push("…"); out.push(total-1); out.push(total); }
      else if(cur >= total-4){ out.push(1); out.push("…"); for(var i=total-5;i<=total;i++) out.push(i); }
      else { out.push(1); out.push("…"); for(var i=cur-2;i<=cur+2;i++) out.push(i); out.push("…"); out.push(total); }
      return out;
    }
    function render(){
      var start = (page-1)*perPage;
      var slice = questions.slice(start, start+perPage);
      var s = score();
      var html = '<div class="scorestrip"><span>Attempted: <b>'+s.a+'</b></span><span>Correct: <b>'+s.c+'</b></span><span>Total MCQs: <b>'+questions.length+'</b></span></div>';
      slice.forEach(function(m, i){
        var qi = start + i;
        html += '<div class="qcard" data-qi="'+qi+'">'
          + '<div class="qtop"><span>Question '+(qi+1)+'</span><span>'+MT.esc(subjectName)+'</span></div>'
          + '<div class="qtext">'+MT.esc(m.question)+'</div><div class="opts">';
        qopts[qi].forEach(function(o){
          html += '<button class="opt" data-k="'+o.k+'">'+MT.esc(o.t)+'<span class="tick"></span></button>';
        });
        html += '</div><div class="explain"></div></div>';
      });
      html += '<div class="pager"><button class="pgbtn" data-pg="'+(page-1)+'"'+(page===1?" disabled":"")+'>‹</button>';
      pageNums(page, totalPages).forEach(function(n){
        if(n === "…") html += '<span class="pgdots">…</span>';
        else html += '<button class="pgbtn'+(n===page?" on":"")+'" data-pg="'+n+'">'+n+'</button>';
      });
      html += '<button class="pgbtn" data-pg="'+(page+1)+'"'+(page===totalPages?" disabled":"")+'>›</button></div>';
      html += '<div class="pgoto"><input type="number" id="pgInput" min="1" max="'+totalPages+'" placeholder="Go to page number"><button class="btn btn-blue" id="pgGo" style="padding:12px 26px">Go</button></div>';
      box.innerHTML = html;

      box.querySelectorAll(".qcard").forEach(function(card){
        var qi = parseInt(card.getAttribute("data-qi"), 10);
        if(answers[qi]){ lockVisual(card, qi); return; }
        card.querySelectorAll(".opt").forEach(function(b){
          b.addEventListener("click", function(){
            answers[qi] = b.getAttribute("data-k");
            lockVisual(card, qi);
            render();
            // restore scroll position roughly
            var c2 = box.querySelector('[data-qi="'+qi+'"]');
            if(c2) c2.scrollIntoView({block:"nearest"});
          });
        });
      });
      function goto(p){
        p = parseInt(p, 10);
        if(p >= 1 && p <= totalPages && p !== page){
          page = p; render();
          document.getElementById("practice").scrollIntoView({behavior:"smooth"});
        }
      }
      box.querySelectorAll(".pgbtn").forEach(function(b){
        if(b.disabled) return;
        b.addEventListener("click", function(){ goto(b.getAttribute("data-pg")); });
      });
      var go = el("pgGo");
      if(go) go.addEventListener("click", function(){ goto(el("pgInput").value); });
    }
    render();
  }

  /* ---------- SIMULATOR ---------- */
  var SIM = {q:100, min:90, neg:0.25, pass:40};
  function initSimulator(){
    var box = el("examBox");
    box.innerHTML = '<div class="simintro">'
      + '<img class="plogo" src="img/exams/logos/logo-ppsc.png" alt="PPSC">'
      + '<h3>PPSC Practice Simulator</h3>'
      + '<p style="color:var(--muted)">Practice like the real exam — questions pulled from the full PPSC bank.</p>'
      + '<div class="simgrid"><div><b>'+SIM.q+'</b>MCQs</div><div><b>'+SIM.min+'</b>Minutes</div><div><b>−'+SIM.neg+'</b>Negative marking</div><div><b>'+SIM.pass+'%</b>Pass marks</div></div>'
      + '<button class="btn btn-amber" id="beginExam">Start Exam</button></div>';
    el("beginExam").addEventListener("click", function(){
      var b = el("beginExam");
      b.disabled = true; b.textContent = "Loading questions…";
      fetchAll(null, function(data){
        if(data.length < 20){
          box.innerHTML = '<div class="empty"><h3>Exam pool building</h3><p>More questions are being added — check back soon.</p></div>';
          return;
        }
        runExam(MT.shuffle(data).slice(0, Math.min(SIM.q, data.length)));
      });
    });
  }
  function runExam(questions){
    var box = el("examBox");
    var idx = 0, answers = new Array(questions.length).fill(null);
    var total = questions.length, timeLeft = SIM.min * 60, timerId = null;
    function fmt(s){ var m = Math.floor(s/60), ss = s%60; return (m<10?"0":"")+m+":"+(ss<10?"0":"")+ss; }
    function render(){
      var m = questions[idx];
      var opts = toOptions(m);
      var html = '<div class="pbar"><i style="width:'+Math.round(idx/total*100)+'%"></i></div>';
      html += '<div class="qcard"><div class="qtop"><span>Question '+(idx+1)+' of '+total+'</span><span class="qtimer" id="examTimer">'+fmt(timeLeft)+'</span></div>';
      html += '<div class="qtext">'+MT.esc(m.question)+'</div><div class="opts">';
      opts.forEach(function(o){
        var sel = answers[idx] === o.k ? ' style="border-color:var(--primary);background:var(--primary-soft)"' : '';
        html += '<button class="opt" data-k="'+o.k+'"'+sel+'>'+MT.esc(o.t)+'</button>';
      });
      html += '</div><div class="qnav"><button class="btn btn-ghost-b" id="prevQ"'+(idx===0?" disabled style='opacity:.4'":"")+'>← Back</button>';
      html += (idx < total-1)
        ? '<button class="btn btn-blue" id="nextQ">Next →</button>'
        : '<button class="btn btn-amber" id="finishExam">Finish Exam</button>';
      html += '</div></div>';
      box.innerHTML = html;
      startTimer();
      box.querySelectorAll(".opt").forEach(function(b){
        b.addEventListener("click", function(){
          answers[idx] = b.getAttribute("data-k");
          box.querySelectorAll(".opt").forEach(function(x){ x.style.borderColor=""; x.style.background=""; });
          b.style.borderColor = "var(--primary)"; b.style.background = "var(--primary-soft)";
        });
      });
      var pq = el("prevQ"); if(pq && idx>0) pq.addEventListener("click", function(){ idx--; render(); });
      var nq = el("nextQ"); if(nq) nq.addEventListener("click", function(){ idx++; render(); });
      var fe = el("finishExam"); if(fe) fe.addEventListener("click", finish);
    }
    function startTimer(){
      if(timerId) return;
      timerId = setInterval(function(){
        timeLeft--;
        var t = el("examTimer");
        if(t){ t.textContent = fmt(Math.max(0,timeLeft)); if(timeLeft < 300) t.classList.add("warn"); }
        if(timeLeft <= 0){ clearInterval(timerId); finish(); }
      }, 1000);
    }
    function finish(){
      if(timerId) clearInterval(timerId);
      var correct = 0, wrong = 0, skipped = 0, review = [];
      questions.forEach(function(m, i){
        var a = answers[i];
        if(a === null) skipped++;
        else if(a === m.correct_option) correct++;
        else wrong++;
        review.push({m:m, a:a});
      });
      var sc = correct - wrong * SIM.neg;
      var pct = Math.round(sc / total * 100);
      var pass = pct >= SIM.pass;
      var html = '<div class="rescard"><span class="verdict '+(pass?"pass":"fail")+'">'+(pass?"PASSED ✓":"NOT QUALIFIED")+'</span>'
        + '<div class="resscore">'+sc.toFixed(2)+' / '+total+'</div>'
        + '<div class="resmeta"><div><b>'+correct+'</b>Correct</div><div><b>'+wrong+'</b>Wrong (−'+SIM.neg+')</div><div><b>'+skipped+'</b>Skipped</div><div><b>'+pct+'%</b>Score</div></div>'
        + '<h3 style="text-align:left;margin:26px 0 14px">Answer Review</h3><div class="review">';
      review.forEach(function(r, i){
        var cls = r.a === null ? "sk" : (r.a === r.m.correct_option ? "ok" : "no");
        var mark = r.a === null ? "Skipped" : (r.a === r.m.correct_option ? "✓ Correct" : "✗ Wrong (you: "+r.a+", answer: "+r.m.correct_option+")");
        html += '<div class="rev"><div class="rq">'+(i+1)+'. '+MT.esc(r.m.question)+'</div>'
          + '<span class="tag '+cls+'">'+mark+'</span>'
          + (r.m.explanation ? '<div class="ex">'+MT.esc(r.m.explanation)+'</div>' : '') + '</div>';
      });
      html += '</div><div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">'
        + '<button class="btn btn-amber" id="retake">Retake Exam</button>'
        + '<a class="btn btn-ghost-b" href="#practice">Practice Subjects</a></div></div>';
      box.innerHTML = html;
      document.getElementById("simulator").scrollIntoView({behavior:"smooth"});
      el("retake").addEventListener("click", initSimulator);
    }
    render();
  }

  /* ---------- UPLOAD ---------- */
  (function(){
    var form = el("uploadForm");
    if(!form) return;
    var msg = el("formMsg");
    function say(text, ok){
      msg.className = "form-msg " + (ok ? "ok" : "err");
      msg.textContent = text;
      document.getElementById("upload").scrollIntoView({behavior:"smooth"});
    }
    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      if(!MT.isConfigured()){ say("Submission service is not configured yet. Please try again later.", false); return; }
      var data = {
        question: el("f_question").value.trim(),
        option_a: el("f_a").value.trim(),
        option_b: el("f_b").value.trim(),
        option_c: el("f_c").value.trim(),
        option_d: el("f_d").value.trim(),
        correct_option: (form.querySelector('input[name="correct"]:checked') || {}).value || null,
        explanation: el("f_explain").value.trim(),
        subject_slug: el("f_subject").value,
        submitter_name: el("f_name").value.trim(),
        status: "pending"
      };
      if(!data.question){ say("Please write the question.", false); return; }
      if(!data.option_a || !data.option_b || !data.option_c || !data.option_d){ say("Please fill all four options (A–D).", false); return; }
      if(!data.correct_option){ say("Please mark the correct answer (A, B, C or D).", false); return; }
      if(!data.subject_slug){ say("Please choose a subject.", false); return; }
      var b = el("submitBtn");
      b.disabled = true; b.textContent = "Submitting…";
      MT.supabase().from("mcq_submissions").insert([data]).then(function(res){
        b.disabled = false; b.textContent = "Submit MCQ";
        if(res.error){ say("Could not submit right now. Please try again later.", false); return; }
        form.reset();
        say("Thank you! Your MCQ was received and is under review. It will appear on the site after approval.", true);
      }).catch(function(){
        b.disabled = false; b.textContent = "Submit MCQ";
        say("Could not submit right now. Please try again later.", false);
      });
    });
  })();

  initSimulator();
})();
