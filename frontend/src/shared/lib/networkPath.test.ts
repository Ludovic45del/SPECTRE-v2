/**
 * Tests des helpers de chemins réseau.
 * @module shared/lib
 */
import { describe, it, expect } from 'vitest';
import { isNetworkPath, normalizeHref } from './networkPath';

describe('isNetworkPath', () => {
    it('détecte les chemins UNC, file: et smb:', () => {
        expect(isNetworkPath('\\\\serveur\\photos')).toBe(true);
        expect(isNetworkPath('file:///C:/data')).toBe(true);
        expect(isNetworkPath('smb://serveur/partage')).toBe(true);
        expect(isNetworkPath('FILE:///c:/x')).toBe(true);
    });

    it('rejette les URLs http(s) et le texte simple', () => {
        expect(isNetworkPath('https://example.com')).toBe(false);
        expect(isNetworkPath('http://example.com')).toBe(false);
        expect(isNetworkPath('example.com')).toBe(false);
        expect(isNetworkPath('')).toBe(false);
    });
});

describe('normalizeHref', () => {
    it('laisse http(s) / file: / smb: inchangés', () => {
        expect(normalizeHref('https://a.com')).toBe('https://a.com');
        expect(normalizeHref('http://a.com')).toBe('http://a.com');
        expect(normalizeHref('file:///c:/x')).toBe('file:///c:/x');
        expect(normalizeHref('smb://srv/p')).toBe('smb://srv/p');
    });

    it('convertit un chemin UNC en file: avec des slashes', () => {
        expect(normalizeHref('\\\\serveur\\photos\\camp')).toBe('file://serveur/photos/camp');
    });

    it('préfixe https:// pour une saisie nue', () => {
        expect(normalizeHref('example.com/path')).toBe('https://example.com/path');
    });
});
