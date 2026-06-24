# RestOs — Business Requirements

## 1. The vision

RestOs is a single place where people can do two things that usually live in two
separate apps:

1. **Order food** from a restaurant's menu — browse dishes, add them to a cart,
   pay, and track the order.
2. **Be part of a food community** — write recipes and food stories, read and
   react to other people's posts, and build a personal profile around what they
   like to eat.

The business wants these two worlds to share one account and one identity, so a
hungry customer and an enthusiastic food blogger are the *same person* with one
login. The platform also needs to understand its users well enough to recommend
the right food and surface the right content.

---

## 2. Who uses the platform

- **Diners / members** — the everyday users. They browse the menu, order food,
  pay, write blog posts, comment, vote, and save things they like.
- **Administrators** — staff who keep the platform healthy: approving content,
  managing the menu, and stepping in when an account misbehaves.

Every person, whether a casual diner or an admin, has **one account**. An account
can be **active** or **blocked**, and the platform must be able to retire an
account without permanently erasing its history (a "soft" removal, so past orders
and posts stay consistent).

---

## 3. What the platform must do

### 3.1 Identity & the personal profile

When someone joins, the platform creates an account that becomes the anchor for
**everything they ever do** — every order, post, comment, vote and saved item
traces back to this one identity.

Beyond the basics (name, email, contact, role, status), a member can enrich their
profile so the experience feels personal:

- a **photo** and a short **bio**,
- their **location**,
- their **cuisine preferences** and **favourite restaurants**,
- any **dietary restrictions** (vegetarian, gluten-free, allergies, etc.),
- their **preferred meal times**,
- their **dining frequency**,
- and their saved **payment methods**.

This richer picture is what powers personalised recommendations and a profile
page that actually reflects the person.

### 3.2 The menu — food and how it's organised

The heart of the ordering side is the **menu**. Each **dish** carries everything a
diner needs to decide:

- its **name**, **price**, and any **discount**,
- how much is **in stock** and how many times it's been **ordered**,
- who **made** it, its **origin**, and its **cuisine**,
- dietary flags — **vegetarian**, **spicy**, **gluten-free** — and free-form
  **tags**,
- and reputation signals: an **average rating**, a **popularity** score, and a
  **bestseller** badge.

Dishes are grouped into **categories** (for example "Desserts", "Beverages",
"Main Course"). A category has its own name, description and image, and is the
primary way diners filter and navigate the menu. Every dish belongs to exactly
one category, and a category naturally holds many dishes.

### 3.3 Reviews on a dish

Diners can leave a **review** directly on a dish — a star rating (0–5), a written
comment, and the date. Reviews are an intrinsic part of the dish itself: they
only make sense in the context of that dish, they're always shown with it, and
they feed the dish's average rating. They are never browsed on their own.

### 3.4 Ordering and the cart

A diner picks a dish, chooses a **quantity**, and adds it to their cart. Each line
in the cart is an **order** for a specific dish by a specific diner, and it
records the unit price, the total, the quantity, and where it is in its lifecycle:
**pending → confirmed → (or) cancelled**. The order also tracks its own
**payment state** separately, because an order can exist before it's paid for.

A single diner places many orders over time; each order is for one dish placed by
one diner.

### 3.5 Payment — including paying for several orders at once

When the diner checks out, the platform takes a **payment**. A payment records the
**amount**, **currency**, a unique **transaction reference**, the **method** used,
its **status** (pending / completed / failed / cancelled), and the raw response
from the payment gateway for auditing.

A key business rule: a diner may have **several orders in the cart and settle them
all in one payment** (a batch checkout). So while the simple case is "one order,
one payment", the platform must also support **one payment covering many orders**.
Every payment is made by exactly one diner.

### 3.6 The community — blogs

Members can publish **blog posts** — typically a recipe or a food story. A post
has a **title**, a **category**, a **description**, step-by-step **instructions**,
**tags**, and an image. Because food content needs oversight, every post moves
through an **approval workflow** (pending → approved) before it's public.

A post is **authored by one member**, and a member can write many posts. Each post
also keeps running tallies of its **upvotes**, **downvotes**, and **comment
count** so it can be ranked and displayed quickly.

### 3.7 Conversation — comments and replies

Readers can **comment** on a blog post (with optional image). A comment belongs to
one post and is written by one member; a post can gather many comments.

Comments can themselves be **replied to**, creating threaded discussion. A reply
is written by a member and lives entirely within the comment it answers — it has
no life of its own outside that conversation.

### 3.8 Reactions — voting

Members express approval or disapproval of a post by **voting** — an upvote or a
downvote. A vote is cast by one member on one post. The business needs to know
*who* voted on *what* (so a person can't vote twice, and so votes can be
recounted), which is why each vote is recorded individually rather than as a bare
number.

### 3.9 Saving things for later

A member can **bookmark** (save) something they want to come back to. Crucially,
the thing they save can be **either a blog post or a dish** — the same "Saved"
list mixes both kinds. Each saved item records who saved it, what kind of thing it
is, and a name for quick display. A member saves many items; the same kind of
content can be saved by many members.

### 3.10 Understanding behaviour — analytics

Quietly in the background, the platform records **activity events** — a view, an
upvote, a downvote, a comment, a new post, a save or an unsave. Each event notes
who did it, what they acted on, a description, and when. These events power the
member's personal **dashboard** (their stats) and give the business insight into
what's engaging the community. Many events are generated by each member, and many
relate to each piece of content.

---

## 4. The business rules behind the relationships

These are the "how many of X relate to Y" rules that the diagram has to encode.
They come straight from the requirements above:

| Business statement | Shape |
| --- | --- |
| A member places many orders; each order is one member's. | one member → many orders |
| Each order is for one dish; a dish appears in many orders. | one dish → many orders |
| A member authors many blog posts; each post has one author. | one member → many posts |
| A post collects many comments; each comment is on one post. | one post → many comments |
| A comment has many replies; each reply is to one comment. | one comment → many replies |
| A member casts many votes; each vote is by one member on one post. | one member → many votes; one post → many votes |
| A member saves many items; a saved item can be a post **or** a dish. | one member → many saves; the saved thing is "either-or" |
| A category contains many dishes; each dish is in one category. | one category → many dishes |
| A dish carries many reviews; a review belongs to that dish. | one dish → many reviews |
| A member makes one payment that can settle **many** orders. | one member → many payments; one payment ↔ many orders |
| Every activity event ties back to one member and (often) one post. | one member → many events; one post → many events |

---

## 5. Non-functional expectations

- **One identity, everywhere.** A person's account is the single thread that ties
  their commerce activity and their community activity together.
- **History is preserved.** Removing an account or a post should not break the
  records that reference it; the platform "soft-deletes" rather than erasing.
- **Content is moderated.** Posts are not public until an admin approves them.
- **Integrity of reactions.** A member's vote and saved items are tracked
  individually so duplicates can be prevented and counts can be trusted.
- **Auditable money.** Every payment keeps a unique transaction reference and the
  gateway's raw response.

---

> **Next:** see [`USER-FLOW.md`](./USER-FLOW.md) for the narrated walkthrough of
> how a real member moves through all of this — and [`RestOs-ERD.drawio`](./RestOs-ERD.drawio)
> for the model these requirements produced.
