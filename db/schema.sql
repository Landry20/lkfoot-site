-- LK FOOTBALL — base Neon (PostgreSQL)
-- Comptes des joueurs, sessions de connexion et sauvegarde de la progression.

create extension if not exists pgcrypto;

create table if not exists comptes (
    id                  uuid primary key default gen_random_uuid(),
    email               text not null unique,
    pseudo              text not null,
    mot_de_passe_hash   text not null,            -- scrypt (sel + empreinte), jamais le mot de passe en clair
    cree_le             timestamptz not null default now(),
    derniere_connexion  timestamptz
);

create table if not exists sessions (
    jeton      text primary key,                  -- jeton aléatoire remis au jeu après connexion
    compte_id  uuid not null references comptes(id) on delete cascade,
    cree_le    timestamptz not null default now(),
    expire_le  timestamptz not null
);
create index if not exists sessions_compte_idx on sessions(compte_id);

create table if not exists profils (
    compte_id       uuid primary key references comptes(id) on delete cascade,
    nom_manager     text,
    age             int,
    nom_equipe      text,
    club_id         text,
    donnees_equipe  jsonb,                        -- équipe de rêve (joueurs, formation, coach…)
    pieces_or       int not null default 150,
    pieces          int not null default 25000,
    maj_le          timestamptz not null default now()
);
