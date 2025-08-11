# Family Social Networking Application

This repository contains a lightweight proof‑of‑concept for a private family social network.  The goal is to provide your family with a **single app** that organises every aspect of life, planning and business while still feeling fun and engaging.  The design draws inspiration from established psychological research on how social media captures (and retains) our attention but it also incorporates mechanisms to **support healthy use** and to avoid exploiting the more addictive aspects of these triggers.

## Project structure

```
family-app-backend/   Express server that exposes a REST API for users, posts and tasks
family-app-backend/data.json  Example dataset with categories and empty arrays for posts/tasks
family-app-frontend/  Next.js application that consumes the API and renders the UI
family-app-README.md   This file
```

### Backend (`family-app-backend`)

* **Express API** – Provides endpoints for fetching/creating posts and tasks, and retrieving categories.  Data is persisted to a JSON file for simplicity.  To run locally:

  ```bash
  cd family-app-backend
  npm install
  npm start
  ```

  The server listens on **port 3001** by default.  You can adjust the `PORT` environment variable to change this.

* **Data model** – The default `data.json` lists categories inspired by your Notion page under `life`, `planning` and `business`.  These become the available categories and subcategories in the UI.  Posts and tasks are empty arrays initially; they will grow as you use the app.

* **API endpoints**

  - `GET /api/categories` – returns the category structure.
  - `GET /api/posts` – returns all posts sorted newest‑first.  Optional query params `category` and `subcategory` filter the list.
  - `POST /api/posts` – creates a new post.  Requires a JSON body with at least a `content` field.
  - `GET /api/tasks` – returns tasks sorted oldest‑first.  Accepts the same filtering parameters as `/api/posts`.
  - `POST /api/tasks` – creates a new task.  Requires a `title` field.
  - `PUT /api/tasks/:id` – update task properties (`title` or `completed`).
  - `DELETE /api/tasks/:id` – removes a task.

### Front‑end (`family-app-frontend`)

* **Next.js** – The UI is implemented as a Next.js app, making it easy to deploy to Vercel.  The only runtime dependency is Node.js.  To run locally:

  ```bash
  cd family-app-frontend
  npm install
  npm run dev
  ```

  You can configure the backend URL via an environment variable called `NEXT_PUBLIC_API_URL`.  In development the app assumes the API is running on `http://localhost:3001`.

* **Home feed** – The landing page (`/`) lets family members share updates, milestones and memories.  Posts can optionally be tagged with a category and subcategory.  New posts are displayed immediately at the top of the feed to provide a **small variable reward**, echoing research showing that unpredictable rewards (such as likes or comments) keep users returning【669748918238341†L96-L100】.

* **Task manager** – The `/tasks` page helps organise chores, errands and goals.  It supports categorisation, real‑time progress tracking and a simple progress bar.  Small achievements, like completing a task and watching the bar fill up, tap into our natural desire for progress and “small wins”【506816373749907†L146-L172】.

* **Navigation** – A persistent navigation bar provides quick access to the feed and tasks.  It’s kept intentionally sparse to reduce decision fatigue and focus attention on core actions.

### Design principles

The UI and feature set integrate several psychological principles drawn from academic literature and product design analysis.  These principles are implemented ethically, with the aim of **enhancing engagement without fostering addiction**.

| Principle | Implementation in this project | Evidence |
| --- | --- | --- |
| **Social connection & social proof** | A central feed allows family members to share updates.  Seeing what others have posted encourages participation and fosters a sense of community【506816373749907†L82-L110】. | Research on mobile apps notes that likes, comments and social sharing satisfy our need for social connection and encourage repeat visits【506816373749907†L88-L110】. |
| **Variable rewards** | New posts appear at the top of the feed and tasks reward users with progress bars and completion counts.  These unpredictable “micro‑rewards” provide dopamine hits similar to likes and comments【669748918238341†L96-L100】, but the platform avoids more manipulative tactics like infinite scrolling. | Studies have shown that intermittent reinforcement (e.g., uncertain rewards) increases engagement and can contribute to compulsive checking【585460977553697†L243-L264】. |
| **Scarcity & time‑limited content** | While not implemented in this proof‑of‑concept, the architecture supports adding seasonal events (e.g., a family challenge or countdown to a wedding) to create urgency.  Care must be taken to avoid manipulative scarcity【669748918238341†L92-L99】. | Social media features like stories and live streams use time limits to trigger FOMO (fear of missing out)【669748918238341†L63-L71】. |
| **Progress & achievement** | Tasks display a progress bar showing the percentage of completed items.  This taps into the satisfaction of incremental progress and encourages ongoing participation【506816373749907†L146-L172】. | Progress mechanics like streaks and completion indicators motivate continued use by providing visible milestones【506816373749907†L146-L172】. |
| **Personalisation & ownership** | Each task and post can be tagged with categories, allowing users to filter content relevant to their lives.  Future extensions could include profile photos and theme customisation. | Users invest more time in apps they can personalise; ownership over content increases commitment【506816373749907†L233-L268】. |
| **FOMO & notifications (ethically)** | The app intentionally avoids infinite scrolling and aggressive notifications.  Instead, users can opt‑in to email or push notifications for important events (not implemented here).  This respects users’ time and mental health【669748918238341†L110-L128】. | Researchers warn that excessive notifications and infinite scroll contribute to addiction and mental health problems【585460977553697†L245-L324】. |

### Extending the proof‑of‑concept

This starter code provides a foundation for a full‑featured family network.  To turn it into a production‑ready app you might consider:

* **Authentication** – Implement user accounts with email/password or OAuth to ensure posts and tasks are tied to specific family members.
* **Real‑time updates** – Use WebSockets or Server‑Sent Events to push new posts and task changes to clients instantly, reinforcing the feeling of connection.
* **Mobile app** – Reuse the API with a React Native or Flutter front‑end to publish on iOS/Android stores.  The Next.js app can remain as a PWA for desktop users.
* **Calendar & financial tools** – Build dedicated modules under the `planning` and `business` categories (e.g. health metrics, budget trackers).  Because the backend stores categories generically, adding new modules requires only front‑end changes.
* **Permissions & privacy** – Implement role‑based access control so sensitive categories (e.g. financial records) are visible only to authorised family members.
* **Digital wellbeing features** – Add dashboards showing time spent, allow users to set usage limits, and send gentle reminders to take breaks, aligning with responsible design practices【669748918238341†L110-L128】.

By grounding the design in evidence‑based psychological principles and prioritising well‑being, your family can enjoy a private social space that encourages connection, organisation and growth without sacrificing mental health.