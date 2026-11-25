"""Pokémon TCG Local Stock Tracker — Discord bot (discord.py).

Thin client of the shared backend API. The bot stores NO inventory of its
own and keeps NO separate database. Every search / stock / watch call goes
to the same backend the website uses:

    POST {TRACKER_API_BASE}/api/actions
    Authorization: Bearer {TRACKER_API_KEY}
    {"action": "runDiscordCommand", "args": {"input": "search zip:60487 radius:25"}}

The backend returns {"title": ..., "lines": [...], "footer": ...}.
The bot only renders that as a Discord embed. It never invents stock.

Availability states (never present Unknown as In stock):
    in_stock, limited_stock, out_of_stock, unknown, last_known_in_stock

Setup:
    pip install -r requirements.txt
    cp ../.env.example .env   # fill DISCORD_BOT_TOKEN, TRACKER_API_BASE, TRACKER_API_KEY
    python bot.py

Env vars (no real values in this repo — see ../.env.example):
    DISCORD_BOT_TOKEN  — Discord Developer Portal > Bot > Reset Token
    TRACKER_API_BASE   — e.g. https://your-tracker.vercel.app
    TRACKER_API_KEY    — shared secret for bot -> backend calls
    DISCORD_GUILD_ID   — optional, sync commands to one test server only
"""

import os
import re

import discord
import httpx
from discord import app_commands

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
API_BASE = os.environ.get("TRACKER_API_BASE", "").rstrip("/")
API_KEY = os.environ.get("TRACKER_API_KEY", "")
GUILD_ID = os.environ.get("DISCORD_GUILD_ID", "")

STATUS_LABEL = {
    "in_stock": "In stock",
    "limited_stock": "Limited stock",
    "limited": "Limited stock",
    "out_of_stock": "Out of stock",
    "unknown": "Unknown",
    "last_known": "Last known in stock",
    "last_known_in_stock": "Last known in stock",
}

STATUS_EMOJI = {
    "in_stock": "🟢",
    "limited_stock": "🟡",
    "limited": "🟡",
    "out_of_stock": "🔴",
    "unknown": "⚪",
    "last_known": "🕐",
    "last_known_in_stock": "🕐",
}

STATUS_COLOR = {
    "in_stock": 0x16A34A,
    "limited_stock": 0xCA8A04,
    "limited": 0xCA8A04,
    "out_of_stock": 0xDC2626,
    "unknown": 0x6B7280,
    "last_known": 0x6B7280,
    "last_known_in_stock": 0x6B7280,
}

ZIP_RE = re.compile(r"^\d{5}$")
VALID_RADII = (5, 10, 25, 50, 100)


def _config_error() -> str | None:
    if not TOKEN:
        return "Bot is not configured: DISCORD_BOT_TOKEN is missing."
    if not API_BASE or not API_KEY:
        return (
            "Bot is not connected to the tracker backend: "
            "TRACKER_API_BASE / TRACKER_API_KEY are missing. "
            "Set them in the host environment — see ../.env.example."
        )
    return None


async def call_backend(command_input: str) -> dict:
    """Forward one command string to the shared backend. Returns its dict.

    On backend failure, returns a safe error dict — never fake stock.
    """
    if not API_BASE or not API_KEY:
        return {
            "title": "Tracker backend not configured",
            "lines": [
                "This bot is a thin client of the tracker backend.",
                "TRACKER_API_BASE / TRACKER_API_KEY are not set on this host.",
                "Ask the tracker owner to set them — see .env.example.",
            ],
            "footer": "No inventory was checked.",
        }
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                f"{API_BASE}/api/actions",
                json={
                    "action": "runDiscordCommand",
                    "args": {"input": command_input},
                },
                headers={"Authorization": f"Bearer {API_KEY}"},
            )
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, dict):
                return data
            return {"title": "Unexpected backend response", "lines": [str(data)]}
    except httpx.HTTPStatusError as exc:
        return {
            "title": "Tracker backend error",
            "lines": [
                f"The backend returned HTTP {exc.response.status_code}.",
                "No inventory was checked. Try again in a few minutes.",
            ],
            "footer": "If this keeps happening, check the backend logs.",
        }
    except httpx.RequestError:
        return {
            "title": "Tracker backend unreachable",
            "lines": [
                "Could not reach the tracker backend at TRACKER_API_BASE.",
                "No inventory was checked. Try again in a few minutes.",
            ],
            "footer": "The bot stores no inventory of its own.",
        }


def embed_for(data: dict, default_color: int = 0xCC0000) -> discord.Embed:
    """Render a backend result as an embed. Unknown stays Unknown."""
    title = data.get("title") or "Pokémon TCG Local Stock Tracker"
    lines = data.get("lines") or []
    description = "\n".join(str(line) for line in lines)[:4000] or "No results."
    embed = discord.Embed(title=title, description=description, color=default_color)
    footer = data.get("footer")
    if footer:
        embed.set_footer(text=str(footer)[:2000])
    image = data.get("image_url")
    if image:
        embed.set_thumbnail(url=image)
    return embed


def _valid_zip(zip_code: str) -> bool:
    return bool(ZIP_RE.match(zip_code.strip()))


def _valid_radius(radius: int) -> bool:
    return radius in VALID_RADII


class TrackerBot(discord.Client):
    def __init__(self) -> None:
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self) -> None:
        if GUILD_ID:
            guild = discord.Object(id=int(GUILD_ID))
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()


bot = TrackerBot()


@bot.tree.command(name="search", description="Search Pokémon TCG products near a ZIP code")
@app_commands.describe(zip="5-digit ZIP code, e.g. 60487", radius="Search radius in miles (5, 10, 25, 50, 100)")
async def search(interaction: discord.Interaction, zip: str, radius: int = 25):
    await interaction.response.defer()
    if not _valid_zip(zip):
        await interaction.followup.send("Please use a 5-digit ZIP code, e.g. `/search zip:60487 radius:25`.")
        return
    if not _valid_radius(radius):
        await interaction.followup.send("Radius must be 5, 10, 25, 50, or 100 miles.")
        return
    data = await call_backend(f"search zip:{zip.strip()} radius:{radius}")
    await interaction.followup.send(embed=embed_for(data))


@bot.tree.command(name="stock", description="Check verified availability of a specific Pokémon product")
@app_commands.describe(product="Product name, e.g. Mega Evolution Elite Trainer Box")
async def stock(interaction: discord.Interaction, product: str):
    await interaction.response.defer()
    data = await call_backend(f"stock {product}")
    await interaction.followup.send(embed=embed_for(data, default_color=0x2A75BB))


@bot.tree.command(name="nearby", description="Show nearby stores with Pokémon cards")
@app_commands.describe(zip="5-digit ZIP code, e.g. 60487", radius="Search radius in miles (5, 10, 25, 50, 100)")
async def nearby(interaction: discord.Interaction, zip: str, radius: int = 25):
    await interaction.response.defer()
    if not _valid_zip(zip):
        await interaction.followup.send("Please use a 5-digit ZIP code, e.g. `/nearby zip:60487 radius:25`.")
        return
    if not _valid_radius(radius):
        await interaction.followup.send("Radius must be 5, 10, 25, 50, or 100 miles.")
        return
    data = await call_backend(f"nearby zip:{zip.strip()} radius:{radius}")
    await interaction.followup.send(embed=embed_for(data))


@bot.tree.command(name="product", description="Display detailed product information")
@app_commands.describe(product="Product name, e.g. Mega Evolution Elite Trainer Box")
async def product_cmd(interaction: discord.Interaction, product: str):
    await interaction.response.defer()
    data = await call_backend(f"product {product}")
    await interaction.followup.send(embed=embed_for(data, default_color=0x2A75BB))


@bot.tree.command(name="watch", description="Add a product to your watchlist")
@app_commands.describe(product="Product name to watch for restocks")
async def watch(interaction: discord.Interaction, product: str):
    data = await call_backend(f"watch {product}")
    await interaction.response.send_message(embed=embed_for(data), ephemeral=True)


@bot.tree.command(name="unwatch", description="Remove a product from your watchlist")
@app_commands.describe(product="Product name to stop watching")
async def unwatch(interaction: discord.Interaction, product: str):
    data = await call_backend(f"unwatch {product}")
    await interaction.response.send_message(embed=embed_for(data), ephemeral=True)


@bot.tree.command(name="alerts", description="Configure stock notifications")
@app_commands.describe(channel="Where to send alerts: website, discord, or email")
async def alerts(interaction: discord.Interaction, channel: str = "discord"):
    if channel not in ("website", "discord", "email"):
        await interaction.response.send_message(
            "Channel must be `website`, `discord`, or `email`.", ephemeral=True
        )
        return
    data = await call_backend(f"alerts {channel}")
    await interaction.response.send_message(embed=embed_for(data), ephemeral=True)


@bot.tree.command(name="stores", description="Show supported nearby retailers")
@app_commands.describe(zip="Optional 5-digit ZIP code to list stores near you")
async def stores(interaction: discord.Interaction, zip: str = ""):
    await interaction.response.defer()
    if zip and not _valid_zip(zip):
        await interaction.followup.send("Please use a 5-digit ZIP code, or leave it blank.")
        return
    cmd = f"stores zip:{zip.strip()}" if zip else "stores"
    data = await call_backend(cmd)
    await interaction.followup.send(embed=embed_for(data))


@bot.tree.command(name="setzip", description="Save your preferred ZIP code")
@app_commands.describe(zip="5-digit ZIP code, e.g. 60487")
async def setzip(interaction: discord.Interaction, zip: str):
    if not _valid_zip(zip):
        await interaction.response.send_message(
            "Please use a 5-digit ZIP code, e.g. `/setzip zip:60487`.", ephemeral=True
        )
        return
    data = await call_backend(f"setzip {zip.strip()}")
    await interaction.response.send_message(embed=embed_for(data), ephemeral=True)


@bot.tree.command(name="watchlist", description="Display your tracked products")
async def watchlist(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    data = await call_backend("watchlist")
    await interaction.followup.send(embed=embed_for(data), ephemeral=True)


@bot.tree.command(name="link", description="Link your Discord account to your website account")
@app_commands.describe(code="One-time link code from the website dashboard (leave blank to get one)")
async def link(interaction: discord.Interaction, code: str = ""):
    cmd = f"link {code.strip()}" if code else "link"
    data = await call_backend(cmd)
    await interaction.response.send_message(embed=embed_for(data), ephemeral=True)


@bot.tree.command(name="help", description="Display available commands")
async def help_cmd(interaction: discord.Interaction):
    data = await call_backend("help")
    await interaction.followup.send(embed=embed_for(data)) if interaction.response.is_done() else await interaction.response.send_message(embed=embed_for(data))


@bot.event
async def on_ready() -> None:
    problem = _config_error()
    if problem:
        print(f"⚠️  {problem}")
    print(f"Logged in as {bot.user} (id: {bot.user.id if bot.user else '?'})")
    print("Slash commands synced. Bot is a thin client of the shared backend.")
    print("It stores no inventory of its own; Unknown is never shown as In stock.")


def main() -> None:
    problem = _config_error()
    if problem:
        raise SystemExit(f"Missing configuration: {problem}\nSee ../.env.example — do not paste secrets in chat.")
    bot.run(TOKEN)


if __name__ == "__main__":
    main()
