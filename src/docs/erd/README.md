# RestOs — Entity Relationship Diagrams

Hand-maintained snapshot of the Mongoose models in `src/app/modules/**`.

| File | Best for | How to open |
| --- | --- | --- |
| [`RestOs-ERD.drawio`](./RestOs-ERD.drawio) | **draw.io** | Go to <https://app.diagrams.net> → **File ▸ Open From ▸ Device** → pick this file. Hand-laid-out: User-centered hub, domain clusters, orthogonal corridor routing, zero line-crossings, dark professional theme. |
| [`REQUIREMENTS.md`](./REQUIREMENTS.md) | The business brief behind the model | The plain-language requirement analysis this ERD was designed from. Read it first to see *why* each entity exists. |
| [`USER-FLOW.md`](./USER-FLOW.md) | Video script / walkthrough | The narration script that walks the diagram entity-by-entity, including the cardinality trade-offs. |

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

Coordinates are computed so the grid stays aligned and routing lanes stay evenly
spaced.

## Regenerating

This `.drawio` is a hand-maintained snapshot of the schema. If you change a model
(`*.model.ts` / `*.interface.ts`), update the matching entity in the diagram, or
ask Claude to regenerate it from the current schema.
