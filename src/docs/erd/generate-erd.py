#!/usr/bin/env python3
"""
RestOs ERD — professional, grid-aligned, corridor-routed .drawio generator.

LAYOUT MODEL (chosen to satisfy the strict no-crossing + User-central rules):
  Three vertical bands, User in the CENTER band so relationships radiate
  left and right with no bundle interleaving:

      LEFT band  (Commerce)        CENTER (Core)     RIGHT band (Content+Engagement)
      Food                          User              Blog
      Review (emb, under Food)                        Comment
      FoodCategory                                    Reply (emb, under Comment)
      Order                                           Vote
      Payment                                         Save
                                                      Analytics

  - User -> left tables : bundle exits User LEFT edge, runs in the left gap.
  - User -> right tables: bundle exits User RIGHT edge, runs in the right gap.
  - Blog -> Vote/Save/Analytics: all within the RIGHT band, short internal lanes.
  - Embedded tables sit directly beneath their parent (vertical composition).
  Lanes are assigned in destination-Y order so parallel pipes never cross.

  Crossings are then checked by verify_erd.py and driven toward zero.
"""
import html

# ---------------- palette ----------------
# LIGHT theme — high-contrast classic ERD (matches the reference screenshot):
# white page, ONE consistent light-blue header for ALL tables, white body rows,
# strong dark connector lines and dark borders for full contrast.
# Tables: light-GRAY header, NO border, BLACK body rows with light text.
CANVAS    = "#ffffff"   # white page background
CONNECTOR = "#3a4452"   # dark, clearly visible connector line
BODY_BG   = "#000000"   # pure BLACK body background for the content rows
BODY_TXT  = "#f2f4f7"   # light body text (reads on black)
ROW_LINE  = "#2a2e36"   # subtle row divider on the black body
TABLE_BORDER = "#e7dde2" # SILK border on every table (soft light silver-rose)
TEXT      = "#11161f"   # dark text for the white note box (flow)

BRAND      = "#ff4d8d"  # brand pink (kept for the flow-note accent only)
# Consistent, intentional header color (a solid deep slate — NOT a washed-out
# disabled gray) with white title text. Sits cleanly above the black body.
HEADER     = "#36405a"  # deep slate-blue header band
HEADER_TXT = "#ffffff"  # white title text on the slate header
BORDER     = TABLE_BORDER

# Embedded tables share the same look (slate header, black body, silk border).
EMB_HEADER = "#36405a"
EMB_BORDER = TABLE_BORDER
EMB_TXT    = "#ffffff"

_PRIMARY = {"header": HEADER, "stroke": BORDER, "txt": HEADER_TXT}
_SECOND  = {"header": EMB_HEADER, "stroke": EMB_BORDER, "txt": EMB_TXT}
DOMAINS = {
    "core": _PRIMARY, "content": _PRIMARY, "commerce": _PRIMARY,
    "engagement": _PRIMARY, "embedded": _SECOND,
}

# ---------------- grid geometry ----------------
ROW_H, HEADER_H, TABLE_W = 26, 32, 300
COL_GAP   = 260
ROW_GAP   = 56
LANE_STEP = 20
EMB_GAP   = 34   # gap between parent and embedded child

# three band X origins
X_LEFT   = 80
X_CENTER = X_LEFT + TABLE_W + COL_GAP
X_RIGHT  = X_CENTER + TABLE_W + COL_GAP

# ---------------- entities ----------------
ENTITIES = [
    dict(id="user", title="User", domain="core", band="center", dashed=False, fields=[
        ("PK","_id : ObjectId"),("UQ","email : String"),("","name : String"),
        ("","role : String [ADMIN|USER]"),("","status : String [ACTIVE|BLOCKED]"),
        ("","photo : String"),("","bio : String"),("","location : String"),
        ("","cuisinePreferences : String[]"),("","socialMedia : { ig, fb, tw }"),
        ("","paymentMethods : String[]"),("","isDeleted : Boolean | timestamps"),
    ]),
    # LEFT band — Commerce
    dict(id="food", title="Food", domain="commerce", band="left", dashed=False, fields=[
        ("PK","_id : ObjectId"),("","foodName : String"),
        ("FK*","foodCategory : String → FoodCategory.name"),
        ("","price / discountPercent : Number"),("","quantity / orders : Number"),
        ("","made_by / food_origin / cuisine"),("","isVeg / isSpicy / isGlutenFree"),
        ("","averageRating / popularity"),("","tags : String[] | bestseller"),
        ("","reviews : Review[] (embedded)"),
    ]),
    dict(id="review", title="Review (embedded in Food)", domain="embedded", band="left", dashed=True, fields=[
        ("","customer_name : String"),("","rating : Number (0-5)"),("","comment / date : String"),
    ]),
    dict(id="foodcat", title="FoodCategory", domain="commerce", band="left", dashed=False, fields=[
        ("PK","_id : ObjectId"),("UQ","name : String"),
        ("","description : String"),("","image : String | timestamps"),
    ]),
    dict(id="order", title="Order (collection: Orders)", domain="commerce", band="left", dashed=False, fields=[
        ("PK","_id : ObjectId"),("FK","food : ObjectId → Food"),("FK","user : ObjectId → User"),
        ("","foodName : String"),("","price / totalPrice / quantity"),("","status / paymentStatus"),
    ]),
    dict(id="payment", title="Payment", domain="commerce", band="left", dashed=False, fields=[
        ("PK","_id : ObjectId"),("FK","orderId : ObjectId → Orders"),
        ("FK","orderIds : ObjectId[] → Orders"),("FK","userId : ObjectId → User"),
        ("UQ","transactionId : String"),("","amount / currency / status"),
    ]),
    # RIGHT band — Content then Engagement
    dict(id="blog", title="Blog", domain="content", band="right", dashed=False, fields=[
        ("PK","_id : ObjectId"),("","title : String"),("FK","author.user : ObjectId → User"),
        ("","author.name : String"),("","category : String"),("","description : String"),
        ("","instructions[] | tags[]"),("","status : String"),
        ("","upvotes / downvotes / commentsCount"),("","isDeleted | timestamps"),
    ]),
    dict(id="comment", title="Comment", domain="content", band="right", dashed=False, fields=[
        ("PK","_id : ObjectId"),("FK","blog : ObjectId → Blog"),("FK","user : ObjectId → User"),
        ("","comment : String"),("","image : String | replies : Reply[]"),
    ]),
    dict(id="reply", title="Reply (embedded in Comment)", domain="embedded", band="right", dashed=True, fields=[
        ("FK","user : ObjectId → User"),("","comment : String | createdAt : Date"),
    ]),
    dict(id="vote", title="Vote", domain="engagement", band="right", dashed=False, fields=[
        ("PK","_id : ObjectId"),("FK","user : ObjectId → User"),("FK","blog : ObjectId → Blog"),
        ("","voteType : upvote | downvote"),
    ]),
    dict(id="save", title="Save", domain="engagement", band="right", dashed=False, fields=[
        ("PK","_id : ObjectId"),("FK","user : ObjectId → User"),("","type : String [blog|food]"),
        ("FK*","item : ObjectId → Blog | Food"),("FK","blog : ObjectId → Blog (legacy)"),
    ]),
    dict(id="analytics", title="Analytics", domain="engagement", band="right", dashed=False, fields=[
        ("PK","_id : ObjectId"),("FK","blog : ObjectId → Blog"),("FK","user : ObjectId → User"),
        ("","actionType : view|upvote|comment|..."),("","resourceName / userName"),
    ]),
]
emap = {e["id"]: e for e in ENTITIES}
def th(e): return HEADER_H + ROW_H*len(e["fields"])

# ---------------- stacking ----------------
TOP = 80
# Left band ordered so commerce edges flow DOWNWARD with no back-routing:
#   FoodCategory -> Food -> Order -> Payment, with Review embedded under Food.
LEFT_STACK  = ["foodcat","food","review","order","payment"]
RIGHT_STACK = ["blog","comment","reply","vote","save","analytics"]

pos = {}
def stack(ids, x):
    y = TOP
    for i,eid in enumerate(ids):
        e=emap[eid]; h=th(e)
        # embedded sits tight under its parent (smaller gap)
        if i>0 and e["domain"]=="embedded":
            y = y - ROW_GAP + EMB_GAP
        pos[eid]=(x,y,TABLE_W,h)
        y += h + ROW_GAP
stack(LEFT_STACK, X_LEFT)
stack(RIGHT_STACK, X_RIGHT)

# center User vertically against the taller band
left_bottom  = pos[LEFT_STACK[-1]][1]+pos[LEFT_STACK[-1]][3]
right_bottom = pos[RIGHT_STACK[-1]][1]+pos[RIGHT_STACK[-1]][3]
full_bottom  = max(left_bottom, right_bottom)
uh = th(emap["user"])
uy = TOP + (full_bottom - TOP - uh)/2.0
pos["user"] = (X_CENTER, uy, TABLE_W, uh)

def rcy(eid, idx):
    x,y,w,h=pos[eid]; return y+HEADER_H+ROW_H*idx+ROW_H/2.0
def midy(eid):
    x,y,w,h=pos[eid]; return y+h/2.0

# ---------------- field-row indices ----------------
R = {
    "order.user":2,"order.food":1,"payment.userId":3,"payment.orderId":1,"payment.orderIds":2,
    "blog.author":2,"comment.blog":1,"comment.user":2,"reply.user":0,
    "vote.user":1,"vote.blog":2,"save.user":1,"save.item":3,"save.blog":4,
    "analytics.blog":1,"analytics.user":2,"food.cat":2,"food.reviews":9,"comment.replies":4,
}

# ---------------- relationships ----------------
# group tag drives routing strategy
RELS = [
    # USER -> LEFT band (exit left, bundle in left gap), ordered by target Y
    dict(s="user",d="order",dr=R["order.user"],lbl="places",grp="L",dashed=False,sa="ERone",da="ERmany"),
    dict(s="user",d="payment",dr=R["payment.userId"],lbl="pays",grp="L",dashed=False,sa="ERone",da="ERmany"),
    # USER -> RIGHT band (exit right, bundle in right gap), ordered by target Y
    dict(s="user",d="blog",dr=R["blog.author"],lbl="authors",grp="Rt",dashed=False,sa="ERone",da="ERmany"),
    dict(s="user",d="comment",dr=R["comment.user"],lbl="writes",grp="Rt",dashed=False,sa="ERone",da="ERmany"),
    dict(s="user",d="reply",dr=R["reply.user"],lbl="writes",grp="Rt",dashed=False,sa="ERone",da="ERmany"),
    dict(s="user",d="vote",dr=R["vote.user"],lbl="casts",grp="Rt",dashed=False,sa="ERone",da="ERmany"),
    dict(s="user",d="save",dr=R["save.user"],lbl="saves",grp="Rt",dashed=False,sa="ERone",da="ERmany"),
    dict(s="user",d="analytics",dr=R["analytics.user"],lbl="generates",grp="Rt",dashed=False,sa="ERone",da="ERmany"),
    # BLOG -> Vote/Save/Analytics (internal right band, short lanes on right side)
    dict(s="blog",d="vote",dr=R["vote.blog"],lbl="receives",grp="RB",dashed=False,sa="ERone",da="ERmany"),
    dict(s="blog",d="analytics",dr=R["analytics.blog"],lbl="tracked by",grp="RB",dashed=False,sa="ERone",da="ERmany"),
    dict(s="blog",d="save",dr=R["save.blog"],lbl="saved (legacy)",grp="RB",dashed=True,sa="ERzeroToOne",da="ERmany"),
    # COMMERCE internal (left band, lanes on left side)
    dict(s="foodcat",d="food",dr=R["food.cat"],lbl="categorizes (by name)",grp="LB",dashed=True,sa="ERone",da="ERmany"),
    dict(s="food",d="order",dr=R["order.food"],lbl="ordered as",grp="LB",dashed=False,sa="ERone",da="ERmany"),
    dict(s="order",d="payment",dr=R["payment.orderId"],lbl="paid by",grp="LBadj",dashed=False,sa="ERone",da="ERmany"),
    dict(s="order",d="payment",dr=R["payment.orderIds"],lbl="batched (orderIds[])",grp="LBadj",dashed=False,sa="ERmany",da="ERmany"),
    # Composition (vertical, embedded)
    dict(s="food",sr=R["food.reviews"],d="review",dr=None,lbl="embeds",grp="emb",dashed=False,sa="diamondThin",da="ERmany"),
    dict(s="comment",sr=R["comment.replies"],d="reply",dr=None,lbl="embeds",grp="emb",dashed=False,sa="diamondThin",da="ERmany"),
]

# ---------------- xml ----------------
def esc(s): return html.escape(s, quote=True)
cells=[]
def add(s): cells.append(s)

for e in ENTITIES:
    x,y,w,h=pos[e["id"]]; d=DOMAINS[e["domain"]]
    dash="dashed=1;" if e["dashed"] else "dashed=0;"
    fstyle="fontStyle=3;" if e["dashed"] else "fontStyle=1;"
    # BLACK body via the table fillColor; GRAY header via swimlaneFillColor;
    # silk border frame. This guarantees the body area renders black in draw.io.
    style=(f"shape=table;startSize={HEADER_H};container=1;collapsible=0;childLayout=tableLayout;"
           f"fillColor={BODY_BG};swimlaneFillColor={d['header']};strokeColor={TABLE_BORDER};"
           f"fontColor={d['txt']};{fstyle}fontSize=13;{dash}strokeWidth=1.5;rounded=1;arcSize=4;")
    add(f'<mxCell id="{e["id"]}" value="{esc(e["title"])}" style="{style}" vertex="1" parent="1">')
    add(f'  <mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w}" height="{h}" as="geometry"/>')
    add('</mxCell>')
    for i,(tag,text) in enumerate(e["fields"]):
        rid=f'{e["id"]}-r{i}'
        # Row + cells are TRANSPARENT so the table's solid black fill shows
        # through. (partialRectangle with all borders off does not paint its own
        # fill in draw.io, which is what left rows white before.)
        add(f'<mxCell id="{rid}" value="" style="shape=tableRow;horizontal=0;startSize=0;strokeColor={ROW_LINE};top=0;left=0;bottom=0;right=0;collapsible=0;dropTarget=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=12;" vertex="1" parent="{e["id"]}">')
        add(f'  <mxGeometry y="{HEADER_H+i*ROW_H}" width="{w}" height="{ROW_H}" as="geometry"/>')
        add('</mxCell>')
        is_pk=(tag=="PK")
        tagfs="fontStyle=5;" if tag=="PK" else ("fontStyle=4;" if tag in("FK","FK*","UQ") else "")
        add(f'<mxCell id="{rid}c1" value="{esc(tag)}" style="shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;strokeColor=none;top=0;left=0;bottom=0;right=0;fontColor={BODY_TXT};align=center;{tagfs}fontSize=11;" vertex="1" parent="{rid}">')
        add(f'  <mxGeometry width="42" height="{ROW_H}" as="geometry"><mxRectangle width="42" height="{ROW_H}" as="alternateBounds"/></mxGeometry>')
        add('</mxCell>')
        underline="fontStyle=4;" if is_pk else ""
        add(f'<mxCell id="{rid}c2" value="{esc(text)}" style="shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;strokeColor=none;top=0;left=0;bottom=0;right=0;fontColor={BODY_TXT};align=left;spacingLeft=6;{underline}fontSize=12;" vertex="1" parent="{rid}">')
        add(f'  <mxGeometry x="42" width="{w-42}" height="{ROW_H}" as="geometry"><mxRectangle width="{w-42}" height="{ROW_H}" as="alternateBounds"/></mxGeometry>')
        add('</mxCell>')

cnt=[0]
def edge(pts, srcport, dstport, sa, da, dashed, label, lblpos=-0.45):
    cnt[0]+=1; i=cnt[0]
    dash="dashed=1;" if dashed else "dashed=0;"
    style=(f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;html=1;"
           f"exitX={srcport[0]};exitY={srcport[1]};exitDx=0;exitDy=0;entryX={dstport[0]};entryY={dstport[1]};entryDx=0;entryDy=0;"
           f"startArrow={sa};endArrow={da};startFill={'1' if sa=='diamondThin' else '0'};"
           f"strokeColor={CONNECTOR};strokeWidth=1.4;{dash}fontSize=10;jettySize=auto;")
    add(f'<mxCell id="edge{i}" style="{style}" edge="1" parent="1" source="{srcport[2]}" target="{dstport[2]}">')
    add('  <mxGeometry relative="1" as="geometry">')
    if pts:
        add('    <Array as="points">'+''.join(f'<mxPoint x="{px:.0f}" y="{py:.0f}"/>' for px,py in pts)+'</Array>')
    add('  </mxGeometry>')
    add('</mxCell>')
    if label:
        add(f'<mxCell id="edge{i}l" value="{esc(label)}" style="edgeLabel;html=1;align=center;verticalAlign=middle;fontSize=10;fontColor=#2a3340;labelBackgroundColor=#ffffff;" connectable="0" vertex="1" parent="edge{i}">')
        add(f'  <mxGeometry x="{lblpos}" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry>')
        add('</mxCell>')

ux,uy_,uw,uh_=pos["user"]

# ----------------------------------------------------------------------
# Non-crossing single-source fan router.
#   side: +1 source fans to the RIGHT, -1 fans to the LEFT.
#   Rule that guarantees no crossings for a vertical bus:
#     * sort targets by Y
#     * exit-Y order on the source matches target-Y order (monotonic)
#     * lane-X assigned so the edge with the LONGEST vertical travel takes the
#       lane NEAREST the source (nested, not interleaved). We measure travel as
#       |target_y - source_mid| and sort lanes by that descending => innermost.
# Source-side and target-side entry both use the same monotonic order, so
# horizontal stubs nest and verticals never cross.
# ----------------------------------------------------------------------
def fan(rels, src_id, side, base_x, src_entry_side, dst_entry_side, lblpos=-0.45):
    sx,sy,sw,sh=pos[src_id]
    smid = sy+sh/2.0
    # order by target Y (top -> bottom)
    rs = sorted(rels, key=lambda r: rcy(r["d"], r["dr"]))
    n=len(rs)
    # exit Y positions on source, evenly spread, in target order (monotonic)
    exits = [sy+HEADER_H + (k+1)*(sh-HEADER_H)/(n+1) for k in range(n)]
    # Nesting rule depends on geometry:
    #  - opposite sides (src exits one side, enters other): longest travel INNERMOST
    #  - same side (U-turn fan, exit & enter same side): longest travel OUTERMOST
    same_side = (src_entry_side == dst_entry_side)
    if same_side:
        # U-turn fan: the deeper a target sits, the OUTER its lane AND the
        # EARLIER (higher) it must exit, so its exit stub clears all inner
        # verticals. So lane rank and exit slot both follow target-Y order:
        # farthest target -> outermost lane -> topmost exit slot.
        order = sorted(range(n), key=lambda k: rcy(rs[k]["d"],rs[k]["dr"]))  # top->bottom target
        # farthest (bottom) target gets outermost lane => rank = reversed target order
        lane_rank = {k: (n-1-rank) for rank,k in enumerate(order)}  # bottom target -> rank n-1 (outer)
        # exit slot: outermost lane exits highest -> exit slot follows lane rank desc
        exit_slot = {k: (n-1-lane_rank[k]) for k in range(n)}  # outer lane -> slot 0 (top)
    else:
        travel = sorted(range(n), key=lambda k: -abs(rcy(rs[k]["d"],rs[k]["dr"]) - exits[k]))
        lane_rank = {k:rank for rank,k in enumerate(travel)}  # rank 0 = innermost
        exit_slot = {k:k for k in range(n)}  # target order
    for k,r in enumerate(rs):
        rank = lane_rank[k]
        lane_x = base_x + side*(rank+1)*LANE_STEP
        ey = exits[exit_slot[k]]
        src=(src_entry_side, round((ey-sy)/sh,3), src_id)
        dx,dy,dw,dh=pos[r["d"]]
        dyc=rcy(r["d"],r["dr"])
        dst=(dst_entry_side, round((dyc-dy)/dh,3), r["d"])
        edge([(lane_x,ey),(lane_x,dyc)], src,dst, r["sa"],r["da"],r["dashed"],r["lbl"], lblpos=lblpos)

# USER -> LEFT band (fan left, into right edge of left-band tables)
left = [r for r in RELS if r["grp"]=="L"]
fan(left, "user", side=-1, base_x=(X_LEFT+TABLE_W + X_CENTER)/2.0,
    src_entry_side=0.0, dst_entry_side=1.0)

# USER -> RIGHT band (fan right, into left edge of right-band tables)
rt=[r for r in RELS if r["grp"]=="Rt"]
fan(rt, "user", side=+1, base_x=(X_CENTER+TABLE_W + X_RIGHT)/2.0,
    src_entry_side=1.0, dst_entry_side=0.0)

# BLOG -> Vote/Save/Analytics: same-side fan on the far-RIGHT of the band.
# For a TOP source fanning DOWN on one side into stacked targets, the
# crossing-free assignment is: nearest target -> innermost lane -> bottom-most
# exit; deepest target -> outermost lane -> top-most exit. Entry stubs then
# nest because each enters below the previous lane turn. We assign explicitly.
rb=[r for r in RELS if r["grp"]=="RB"]
rb.sort(key=lambda r: rcy(r["d"], r["dr"]))  # vote, analytics, save? -> by Y
nrb=len(rb)
bx,by,bw,bh=pos["blog"]
base_rb=(X_RIGHT+TABLE_W)+24
for k,r in enumerate(rb):
    # k=0 = nearest target -> innermost lane. Entry stubs nest correctly.
    rank = k                       # 0 = innermost (nearest target)
    lane_x = base_rb + rank*LANE_STEP
    # exit slot REVERSED: outermost lane (deepest target) exits HIGHEST so its
    # exit stub clears every inner vertical. nearest target exits lowest.
    slot = (nrb-1-k)
    ey = by+HEADER_H + (slot+1)*(bh-HEADER_H)/(nrb+1)
    src=(1.0, round((ey-by)/bh,3),"blog")
    dx,dy,dw,dh=pos[r["d"]]
    dyc=rcy(r["d"],r["dr"])
    dst=(1.0, round((dyc-dy)/dh,3), r["d"])
    edge([(lane_x,ey),(lane_x,dyc)], src,dst, r["sa"],r["da"],r["dashed"],r["lbl"], lblpos=0.3)

# ---- COMMERCE internal: FoodCategory->Food, Food->Order on LEFT side of left band
lb=[r for r in RELS if r["grp"]=="LB"]
left_edge_x = X_LEFT
# longer-span edge takes the OUTER lane so its vertical isn't crossed by the
# shorter edge's horizontal stub (nested routing).
def span_of(r):
    return abs(rcy(r["d"], r["dr"]) - midy(r["s"]))
order_lb = sorted(range(len(lb)), key=lambda k: span_of(lb[k]))  # short -> long
rank_lb = {k:rank for rank,k in enumerate(order_lb)}
for k,r in enumerate(lb):
    lane_x = left_edge_x - 36 - rank_lb[k]*LANE_STEP
    sx,sy,sw,sh=pos[r["s"]]
    # exit from the source's bottom-left corner region heading down
    src=(0.0, round((min(rcy(r["s"], len(emap[r["s"]]["fields"])-1), sy+sh-10)-sy)/sh,3), r["s"])
    dx,dy,dw,dh=pos[r["d"]]
    dyc=rcy(r["d"],r["dr"])
    dst=(0.0, round((dyc-dy)/dh,3), r["d"])
    syc=min(rcy(r["s"], len(emap[r["s"]]["fields"])-1), sy+sh-10)
    edge([(lane_x,syc),(lane_x,dyc)], src,dst, r["sa"],r["da"],r["dashed"],r["lbl"], lblpos=-0.3)

# ---- Order->Payment adjacent: route on the RIGHT side of left band (they're stacked)
lbadj=[r for r in RELS if r["grp"]=="LBadj"]
sx,sy,sw,sh=pos["order"]
# stagger exit rows so the two parallel pipes have distinct horizontal stubs
# outer lane (higher k) must exit HIGHER so its stub clears the inner vertical
exit_rows=[5,3]  # k=0 inner -> lower row(5); k=1 outer -> higher row(3)
for k,r in enumerate(lbadj):
    lane_x = (X_LEFT+TABLE_W) + 26 + k*LANE_STEP
    syc=rcy("order",exit_rows[k])
    src=(1.0, round((syc-sy)/sh,3),"order")
    dx,dy,dw,dh=pos["payment"]
    dyc=rcy(r["d"],r["dr"])
    dst=(1.0, round((dyc-dy)/dh,3),"payment")
    edge([(lane_x,syc),(lane_x,dyc)], src,dst, r["sa"],r["da"],r["dashed"],r["lbl"], lblpos=0.0)

# ---- Composition embedded: vertical, parent bottom -> child top
for r in [r for r in RELS if r["grp"]=="emb"]:
    sx,sy,sw,sh=pos[r["s"]]; dx,dy,dw,dh=pos[r["d"]]
    cx=sx+sw/2.0
    src=(0.5,1.0,r["s"]); dst=(0.5,0.0,r["d"])
    edge([(cx,sy+sh+10),(cx,dy-10)], src,dst, r["sa"],r["da"],r["dashed"],r["lbl"], lblpos=0.0)

# ---------------- flow summary note (human-readable, does NOT touch the ERD) ----
# (Legend removed per request.) Clean, well-spaced step-by-step flow with arrows.
# Placed in the open area below the User column. HTML <br> gives real line gaps.
fnx = X_CENTER
fny = pos["user"][1] + th(emap["user"]) + 80

flow_html = (
    "<b style='font-size:13px;'>HOW THE DATA FLOWS</b>"
    "<br><br>"
    "<b>1. Identity</b>"
    "<br>&#160;&#160;A <b>User</b> account is the centre — every record links back to it."
    "<br><br>"
    "<b>2. Content</b>"
    "<br>&#160;&#160;User &#8594; writes a <b>Blog</b>"
    "<br>&#160;&#160;Blog &#8594; gets <b>Comments</b> &#8594; each Comment holds <b>Replies</b>"
    "<br>&#160;&#160;Blog &#8594; collects <b>Votes</b> &#8594; activity logged in <b>Analytics</b>"
    "<br><br>"
    "<b>3. Commerce</b>"
    "<br>&#160;&#160;<b>FoodCategory</b> &#8594; groups <b>Food</b> &#8594; Food holds <b>Reviews</b>"
    "<br>&#160;&#160;User orders Food &#8594; <b>Order</b> &#8594; settled by <b>Payment</b>"
    "<br><br>"
    "<b>4. Engagement</b>"
    "<br>&#160;&#160;User &#8594; bookmarks Blog / Food into <b>Saves</b>"
)
FLOW_W, FLOW_H = 380, 320
add(f'<mxCell id="flowbox" value="{esc(flow_html)}" '
    f'style="rounded=1;arcSize=4;whiteSpace=wrap;html=1;verticalAlign=top;align=left;'
    f'fontSize=12;fontColor={TEXT};fillColor=#ffffff;strokeColor={BRAND};strokeWidth=1.5;'
    f'spacingLeft=14;spacingTop=12;spacingRight=12;spacing=4;" vertex="1" parent="1">')
add(f'  <mxGeometry x="{fnx:.0f}" y="{fny:.0f}" width="{FLOW_W}" height="{FLOW_H}" as="geometry"/>')
add('</mxCell>')

# ---------------- assemble ----------------
canvas_w = X_RIGHT + TABLE_W + 220
canvas_h = max(full_bottom, fny + FLOW_H) + 120
body="\n".join("        "+c for c in cells)
doc=f'''<mxfile host="app.diagrams.net" agent="RestOs ERD generator v3" version="24.0.0" type="device">
  <diagram name="RestOs-ERD" id="restos-erd-1">
    <mxGraphModel dx="2400" dy="1500" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{canvas_w:.0f}" pageHeight="{canvas_h:.0f}" math="0" shadow="0" background="{CANVAS}">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
{body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''
out=r"e:\personal\personal-projects\rest-os\RestOs-server\src\docs\erd\RestOs-ERD.drawio"
open(out,"w",encoding="utf-8").write(doc)
print("WROTE",out); print("canvas",canvas_w,canvas_h); print("edges",cnt[0])
