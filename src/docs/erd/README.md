# RestOs — Entity Relationship Diagrams

Auto-generated from the Mongoose models in `src/app/modules/**`.
Three formats are provided so you can open it wherever is easiest — pick one:

| File | Best for | How to open |
| --- | --- | --- |
| [`RestOs-ERD.drawio`](./RestOs-ERD.drawio) | **draw.io** (your ask) | Go to <https://app.diagrams.net> → **File ▸ Open From ▸ Device** → pick this file. Hand-laid-out: User-centered hub, domain clusters, orthogonal corridor routing, zero line-crossings, dark professional theme. |
| [`RestOs-ERD.mmd`](./RestOs-ERD.mmd) | Quick view / GitHub / VS Code | Paste into <https://mermaid.live>, or render in any Markdown that supports Mermaid. draw.io can also import it via **Arrange ▸ Insert ▸ Advanced ▸ Mermaid**. |
| [`RestOs-ERD.dbml`](./RestOs-ERD.dbml) | Interactive auto-layout | Paste into <https://dbdiagram.io>. Auto-routes every relationship; exports to PNG/PDF/SQL. |

## Entities (11)

| Entity | Collection | Kind |
| --- | --- | --- |
| User | `users` | core |
| Blog | `blogs` | core |
| Food | `foods` | core |
| FoodCategory | `foodcategories` | core |
| Order | `orders` (model `Orders`) | core |
| Payment | `payments` | core |
| Comment | `comments` | core |
| Vote | `votes` | core |
| Save | `saves` | core |
| Analytics | `analytics` | core |
| Review | *(embedded in Food)* | subdocument |
| Reply | *(embedded in Comment)* | subdocument |

## Relationships

**Enforced ObjectId references (`ref:` in schema):**

| From | → | To | Cardinality |
| --- | --- | --- | --- |
| Order.user | → | User | many-to-one |
| Order.food | → | Food | many-to-one |
| Blog.author.user | → | User | many-to-one |
| Comment.blog | → | Blog | many-to-one |
| Comment.user | → | User | many-to-one |
| Reply.user *(embedded)* | → | User | many-to-one |
| Vote.user | → | User | many-to-one |
| Vote.blog | → | Blog | many-to-one |
| Save.user | → | User | many-to-one |
| Save.blog *(legacy)* | → | Blog | many-to-one (optional) |
| Analytics.user | → | User | many-to-one |
| Analytics.blog | → | Blog | many-to-one |
| Payment.userId | → | User | many-to-one |
| Payment.orderId | → | Order | many-to-one |
| Payment.orderIds[] | → | Order | many-to-many |

**Composition (embedded subdocuments — no separate collection):**

| Parent | contains | Child |
| --- | --- | --- |
| Food | reviews[] | Review |
| Comment | replies[] | Reply |

**Logical references (matched by string / polymorphic — NOT enforced by the DB):**

| Field | Points at | Note |
| --- | --- | --- |
| Food.foodCategory (String) | FoodCategory.name | matched by name, no ObjectId FK |
| Save.item (ObjectId) | Blog._id **or** Food._id | polymorphic; resolved via `Save.type` |

> ⚠️ The logical references are drawn with **dashed lines** in the diagrams to
> distinguish them from real Mongoose `ref` foreign keys (solid lines).

## Layout & design (draw.io file)

The `.drawio` diagram is laid out deliberately, not auto-arranged:

- **User-centered**: `User` sits in the middle column; relationships radiate left
  (Commerce) and right (Content + Engagement) so the eye lands on User first.
- **Domain clusters**: Commerce (Food, FoodCategory, Order, Payment) on the left;
  Content (Blog, Comment) and Engagement (Vote, Save, Analytics) on the right.
- **Embedded below parent**: `Review` sits directly under `Food`, `Reply` directly
  under `Comment` (vertical composition with a ◆ diamond end).
- **Corridor routing**: every connector is orthogonal and travels in a reserved
  routing lane in the gaps between columns. Parallel lines keep an equal 20px gap.
- **Zero crossings, zero through-table lines**: verified geometrically — no
  connector passes through any table body and no two connectors cross.
- **Restrained palette**: dark charcoal canvas, one neutral connector color,
  soft per-domain header tints (blue/green/amber/violet) + gray for embedded.

It is produced by [`generate-erd.py`](./generate-erd.py) rather than edited by
hand — coordinates are computed so the grid stays perfectly aligned and lanes
stay evenly spaced. Run `python generate-erd.py` to regenerate the `.drawio`.

## Regenerating

These files are hand-maintained snapshots of the schema. If you change a model
(`*.model.ts` / `*.interface.ts`), update the matching entity in all three files,
or ask Claude to regenerate them from the current schema.
