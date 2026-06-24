# RestOs ERD — Video Script

> **What this video is.** This is a walkthrough of the data model behind
> **RestOs** — an online **restaurant management system** that's two products in
> one: a place to **order food**, and a **community** where people write recipes,
> review dishes, and talk about food.
>
> **Where the model came from.** None of this diagram is guesswork. It was
> designed from a plain-language **requirement analysis** —
> [`REQUIREMENTS.md`](./REQUIREMENTS.md) — which describes, in pure business
> terms, what RestOs has to do: *members order food, members write blogs, members
> react to each other's content, and the platform learns from all of it.* That
> brief is the "why"; this Entity Relationship Diagram
> ([`RestOs-ERD.drawio`](./RestOs-ERD.drawio)) is that brief made precise.
>
> **How to read this script.** We go **one entity at a time**, in the order a real
> user touches them. Each entity follows the same five beats:
>
> 1. **What it is** — the entity in one line.
> 2. **Fields** — what it stores, and *why* those fields.
> 3. **Cardinalities** — who it connects to and how many.
> 4. **The decision** — why it's its own entity (or embedded), why the cardinality
>    is what it is.
> 5. **The trade-off** — what we gave up to get it.
>
> Lines in **`[ON SCREEN: …]`** tell you what the diagram should be showing.

---

## 0. Cold open

**`[ON SCREEN: full ERD zoomed out → slow zoom toward User.]`**

> "This is RestOs — a restaurant management system. Two worlds, one platform:
> **ordering food** and a **food community.**
>
> But before any of these boxes existed, there was a **requirement analysis** —
> a plain description of what the business needs. Every entity you're about to
> see is the answer to one of those needs. So as we walk through it, I'm not just
> going to tell you *what* each box is — I'm going to tell you the **decision**
> behind it: why it's a separate entity, why the relationship is one-to-many or
> many-to-many, and what we **traded off** to get there.
>
> We'll go one entity at a time, in the order a real user actually touches them.
> Everything starts with the **User**."

---

## 1. User — the anchor

**`[ON SCREEN: highlight User at the center; pulse every line radiating out.]`**

> **What it is:** "The account for one human. It's the center of the whole
> diagram — orders, blogs, comments, replies, votes, saves, payments and
> analytics all point back to it."
>
> **Fields & why:** "Identity (name, email, role, status) plus a rich **profile**:
> photo, bio, location, cuisine preferences, dietary restrictions, preferred meal
> times, dining frequency, payment methods. Those profile fields aren't
> decoration — they're the **fuel for personalised recommendations**. And
> `status` (active / blocked) plus an `isDeleted` flag exist so we can retire an
> account **without erasing it.**"
>
> **Cardinalities:** "One-to-many with almost everything — **one User → many**
> orders, blogs, comments, votes, saves, payments, analytics events."
>
> **The decision:** "One identity for **both** worlds. A hungry customer and a
> food blogger are the **same account**. We rejected splitting 'customers' and
> 'authors' into two entities — that's two profiles and two histories for one
> person."
>
> **The trade-off:** "We never hard-delete. We keep 'dead' rows around (soft
> delete) so a deleted user's past orders and posts still resolve. Cost: a little
> clutter; benefit: history never breaks."

---

## 2. Food Category — the menu's shelves

**`[ON SCREEN: highlight FoodCategory → Food, left side.]`**

> **What it is:** "The buckets the menu is organised into — 'Desserts',
> 'Beverages', 'Main Course'."
>
> **Fields & why:** "Just `name`, `description`, `image` — a category is a label,
> not a thing with behaviour, so it stays lean."
>
> **Cardinalities:** "**One category → many dishes.** Each dish lives in exactly
> one category."
>
> **The decision:** "It's a **separate entity** instead of a free-text field on
> each dish so the menu's navigation is consistent — one place to rename or
> re-image a category."
>
> **The trade-off:** "Here's the honest one — a dish links to its category **by
> name, not by ID**. That's the **dashed line** on the diagram. Benefit: reads are
> simple, we get the category name for free. Cost: rename a category and you have
> to update the dishes pointing at it. We chose convenience and flagged it
> honestly."

---

## 3. Food — the dish

**`[ON SCREEN: highlight Food; show its connections to Category, Order, Save, Review.]`**

> **What it is:** "A single menu item the diner can order."
>
> **Fields & why:** "Everything a diner needs to decide and everything the system
> needs to sell: `name`, `price`, `discount`, `quantity` in stock, `orders`
> count; provenance (`made_by`, `origin`, `cuisine`); dietary flags (`isVeg`,
> `isSpicy`, `isGlutenFree`) and `tags`; and reputation — `averageRating`,
> `popularity`, `bestseller`. Why store `averageRating` and `orders` on the dish
> itself? So the menu can **sort and filter instantly** without recomputing."
>
> **Cardinalities:** "**One dish → many orders**, **one dish → many reviews**, and
> a dish can be **saved by many** users."
>
> **The decision:** "Food is the core commerce entity, so it's heavy on purpose —
> it carries its own reputation signals."
>
> **The trade-off:** "Storing `averageRating`/`orders` on the dish is
> **denormalisation** — fast to read, but we have to keep those numbers in sync
> when a new review or order lands."

---

## 4. Review — embedded inside Food

**`[ON SCREEN: highlight Review under Food with the diamond (◆) connector.]`**

> **What it is:** "A diner's rating and comment on a dish — stars (0–5), a comment,
> a date."
>
> **Fields & why:** "Tiny by design: `customer_name`, `rating`, `comment`,
> `date`. Just enough to show under the dish."
>
> **Cardinality:** "**One Food contains many Reviews** — drawn with a **diamond**,
> which means *composition*, not a foreign-key arrow."
>
> **The decision — why embedded, not its own entity:** "A review has **no meaning
> without its dish.** You never browse 'all reviews' globally; they're always
> shown *with* the dish and they feed its rating. So we **embed** them inside the
> Food document instead of giving them their own collection and ID."
>
> **The trade-off — and the MongoDB limit:** "Embedding makes reading a
> dish-with-its-reviews a **single read** — fast. The catch is MongoDB's
> **16 MB document cap**: a document and *everything embedded in it* must fit in
> 16 MB. For a few hundred short reviews per dish that's a non-issue. But this is a
> real ceiling — if a dish could collect *tens of thousands* of reviews, embedding
> would eventually blow the cap and you'd have to promote Review to its own
> collection. **The rule:** embed bounded, parent-owned data; break it out once
> it can grow without limit."

---

## 5. Order — who ordered what

**`[ON SCREEN: highlight User → Order ← Food.]`**

> **What it is:** "One cart line — a specific dish, ordered by a specific diner."
>
> **Fields & why:** "`food`, `user`, a snapshot of `foodName`/`price`,
> `quantity`, `totalPrice`, and **two** status fields: `status` (pending →
> confirmed → cancelled) and a separate `paymentStatus`. We snapshot the price so
> a later price change doesn't rewrite history."
>
> **Cardinalities:** "Sits between two parents — **one User → many Orders**, and
> **one Food → many Orders.**"
>
> **The decision:** "Order is its own entity because it's the meeting point of
> *who* and *what*, with its own lifecycle. And it keeps **two** statuses on
> purpose: an order can **exist before it's paid for** — it lives in the cart — so
> order-state and payment-state are decoupled."
>
> **The trade-off:** "Two status fields mean a little more to keep consistent, but
> an unpaid order is now a valid record, not an error."

---

## 6. Payment — the many-to-many decision

**`[ON SCREEN: highlight Order → Payment — show BOTH the solid one-to-many AND the many-to-many line.]`**

> **What it is:** "A settled transaction — what the diner actually paid."
>
> **Fields & why:** "`amount`, `currency`, a **unique** `transactionId`,
> `paymentMethod`, `status`, and the raw `sslcommerzResponse` from the gateway —
> kept because **money has to be auditable.**"
>
> **Cardinalities — the interesting part:** "**One User → many Payments.** And
> between Order and Payment there are actually **two** relationships: a **solid
> one-to-many** (one order → one payment, the common case) *and* a
> **many-to-many** (one payment covering many orders)."
>
> **The decision — why resolve it as many-to-many:** "The requirement is a
> **batch checkout** — put several orders in the cart, pay for them all in **one**
> transaction. One order to one payment can't express that; you need a payment
> that references **many** orders, and an order that could appear in a batch. The
> clean way to model 'many things ↔ many things' is a **many-to-many** — here,
> the payment holds a list of order IDs. We kept the plain one-to-many *too*,
> because the single-order case is the most common and modelling it directly keeps
> everyday queries simple."
>
> **The trade-off:** "A bit of redundancy — two ways an order can relate to a
> payment — bought in exchange for both the common path **and** the batch path
> being first-class. The alternative (forcing every payment to carry an array even
> for one order) would make the simple case pay for the rare one."

---

## 7. Blog — the community post

**`[ON SCREEN: pan right; highlight User → Blog.]`**

> **What it is:** "A member's recipe or food story."
>
> **Fields & why:** "`title`, `category`, `description`, step-by-step
> `instructions`, `tags`, `image`, an approval `status`, and **stored counts** —
> `upvotes`, `downvotes`, `commentsCount`."
>
> **Cardinalities:** "**One author (User) → many Blogs.** Each post has exactly
> one author."
>
> **The decision:** "Why store the vote/comment **counts** on the post instead of
> counting every time? Because the feed has to render **instantly**. We chose to
> keep a running tally."
>
> **The trade-off:** "Those counts are **denormalised** — every new vote or
> comment has to update the number, and if that update is missed the count drifts.
> Speed now, sync discipline later. Plus posts go through an **approval workflow**
> before going public — moderation, because it's food content from the crowd."

---

## 8. Comment — its own entity

**`[ON SCREEN: highlight Blog → Comment, and User → Comment.]`**

> **What it is:** "A reader's comment on a blog post."
>
> **Fields & why:** "`blog`, `user`, the `comment` text, optional `image`,
> timestamps."
>
> **Cardinalities:** "**One Blog → many Comments**, and **one User → many
> Comments.**"
>
> **The decision — why a separate entity (unlike Review):** "Comments are
> **queried, moderated, and counted independently** of any single render — you
> might page through them, moderate one, count them. That independence is exactly
> why Comment gets its **own collection and ID**, while Review stayed embedded."
>
> **The trade-off:** "A separate collection means an extra lookup to show a post
> *with* its comments — but that's the right cost for data that has its own life."

---

## 9. Reply — embedded inside Comment

**`[ON SCREEN: highlight Reply under Comment with the diamond (◆) connector.]`**

> **What it is:** "A reply to a comment — threaded discussion, one level deep."
>
> **Fields & why:** "Minimal: `user`, `comment` text, `createdAt`."
>
> **Cardinality:** "**One Comment contains many Replies** — diamond connector,
> *composition* again."
>
> **The decision — why embedded:** "Here's the deliberate contrast with Comment.
> A reply **only ever exists inside the conversation** it answers — you never list
> replies on their own. So replies are **embedded inside the Comment document**,
> just like reviews are embedded in food. Same feature shape as a comment;
> **opposite** modelling decision — driven entirely by *how the data is used.*"
>
> **The trade-off — how many replies can you embed:** "Same MongoDB rule as
> reviews: the Comment document and its embedded replies must fit under the
> **16 MB cap**. A reply is a few hundred bytes, so a single comment could
> realistically hold **tens of thousands** of replies before that's a concern —
> far more than any real thread. We accept the cap because threads are naturally
> bounded; if replies were unbounded, we'd promote them to their own collection
> like we did with Comment."

---

## 10. Vote — entity, not a counter

**`[ON SCREEN: highlight User → Vote ← Blog.]`**

> **What it is:** "One member's up or down reaction on one post."
>
> **Fields & why:** "`user`, `blog`, `voteType` (upvote / downvote)."
>
> **Cardinalities:** "**One User → many Votes**, **one Blog → many Votes.**"
>
> **The decision — why an entity, not just a `+1`:** "We could've just bumped a
> number on the blog. We didn't, because we need to know **who** voted on **what**
> — that's the only way to **stop a person voting twice** and to recount if we
> ever need to. So each vote is a recorded row."
>
> **The trade-off:** "Many more rows than a single counter — but **integrity we
> can trust.** (And the fast `upvotes`/`downvotes` numbers on the Blog are the
> *cached* view of these rows — best of both.)"

---

## 11. Save — the polymorphic bookmark

**`[ON SCREEN: highlight Save with its two dashed lines reaching BOTH Blog and Food.]`**

> **What it is:** "A bookmark. One 'Saved' list that can mix **blog posts and
> dishes** together."
>
> **Fields & why:** "`user`, a `type` (`blog` | `food`), the `item` it points to,
> and a `name` for quick display."
>
> **Cardinalities:** "**One User → many Saves**, and the saved thing can be saved
> by **many** users."
>
> **The decision — why one polymorphic entity:** "The requirement is a *single*
> saved list mixing two kinds of content. Instead of two entities ('saved blogs'
> and 'saved foods'), we use **one Save entity with a `type` field** — the `item`
> points at **either** a Blog **or** a Food, resolved by `type`. That's the two
> **dashed lines** on the diagram: a soft, either-or reference."
>
> **The trade-off:** "One tidy list and one feature to maintain, at the cost of
> the link not being a strict foreign key — the app resolves it by `type` rather
> than the database enforcing it."

---

## 12. Analytics — the quiet layer

**`[ON SCREEN: highlight Analytics; dim the rest slightly.]`**

> **What it is:** "An event log — every meaningful action a user takes (view,
> upvote, comment, new post, save, unsave)."
>
> **Fields & why:** "`user`, `blog`, `actionType`, `resourceName`, `userName`, a
> `description`, and a `timestamp` — enough to reconstruct *who did what, to what,
> when.*"
>
> **Cardinalities:** "**One User → many events**, and each event ties back to the
> content it was about."
>
> **The decision — why a separate entity:** "Behaviour is something the business
> wants to **understand**, not a side effect to throw away. Logging it as its own
> entity means we can power the member's **dashboard** (their orders, saves, posts,
> upvotes received) and read what the community engages with."
>
> **The trade-off:** "It grows fast — lots of rows — but it's append-only and the
> insight is worth the volume."

---

## 13. Closing — one user, through every entity

**`[ON SCREEN: animate one glowing path traveling through the entities in order.]`**

> "Let's land it by following **one person** through the whole board.
>
> She signs up — her **User** account, the anchor. She fills in her **profile**.
>
> She browses the menu — **Food**, shelved by **Food Category** — and reads the
> **Reviews** embedded on each dish.
>
> She adds a dish to her cart — an **Order** — adds two more, and checks out all
> three in a single **Payment**. That's the **many-to-many** we built on purpose.
>
> Then she crosses into the community. She writes a **Blog** post. People leave
> **Comments**, with threaded **Replies** embedded underneath. Her post collects
> **Votes**. She **Saves** a recipe *and* a dish to one bookmark list — the
> **polymorphic** Save.
>
> And every action quietly lands in **Analytics**, lighting up her dashboard.
>
> **One identity, two worlds, and every relationship the result of a real
> decision** — embed or separate, one-to-many or many-to-many, store the count or
> compute it. That's the model."

**`[ON SCREEN: zoom out to the full ERD; hold.]`**

> "Every box started as a sentence in the requirement analysis. The takeaway:
> **good data models don't start with tables — they start with what the business
> needs to do.** Thanks for watching."

---

## The flow in one line

> **Sign in → Profile → Browse (Category → Food → Reviews) → Order → Pay (batched, many-to-many) → Engage (Blog → Comment → Reply / Vote / Save) → Analytics → Dashboard.**

## Quick reference — entity, cardinality, the decision

| # | Entity | Key cardinality | The decision & trade-off |
| --- | --- | --- | --- |
| 1 | **User** | 1 → many (everything) | One identity for both worlds; soft-delete keeps history |
| 2 | **Food Category** | 1 category → many dishes | Linked by **name** (dashed) — simple reads vs. rename cost |
| 3 | **Food** | 1 → many orders/reviews/saves | Stores rating/orders — denormalised for fast menu |
| 4 | **Review** | embedded in Food (◆) | Embed: no life outside its dish; bounded by 16 MB doc cap |
| 5 | **Order** | User→many, Food→many | Two statuses — order can exist before payment |
| 6 | **Payment** | 1→many **and** many↔many | Many-to-many for **batch checkout**; redundancy vs. clean common case |
| 7 | **Blog** | 1 author → many posts | Stored vote/comment counts — denormalised for fast feed |
| 8 | **Comment** | Blog→many, User→many | **Own entity** — queried/moderated/counted independently |
| 9 | **Reply** | embedded in Comment (◆) | Embed: only lives in its thread; 16 MB cap, threads are bounded |
| 10 | **Vote** | User→many, Blog→many | **Entity not counter** — know who voted, prevent double-votes |
| 11 | **Save** | User→many (polymorphic) | One **polymorphic** entity for blog *or* food (dashed, by `type`) |
| 12 | **Analytics** | User→many events | Behaviour as a first-class entity — powers the dashboard |
