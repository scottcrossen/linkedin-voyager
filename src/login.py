#!/usr/bin/env python3

from linkedin_api import Linkedin
from linkedin_api.client import UnauthorizedException, ChallengeException
from linkedin_api.settings import COOKIE_FILE_PATH
import click
import os

def _get_cookies_filepath(username):
    """
    Return the absolute path of the cookiejar for a given username
    """
    return "{}{}.jr".format(COOKIE_FILE_PATH, username)

@click.command()
@click.option('-u', '--username')
@click.option('-p', '--password')
@click.option('--cache/--no-cache', default=False)
@click.option('--cleanup/--no-cleanup', default=True)
def login(username, password, cache, cleanup):
    try:
        api = Linkedin(username, password, refresh_cookies=not cleanup)
    except ChallengeException:
        print('CHALLENGE')
        return
    except UnauthorizedException:
        print('UNAUTHORIZED')
        return
    for cookie in api.client.session.cookies:
        builder = f'{cookie.name}={cookie.value}'
        for key in ['expires', 'path', 'domain']:
            if cookie.__dict__[key]:
                builder += f'; {key}={cookie.__dict__[key]}'
        if cookie.__dict__['_rest']['SameSite']:
            sameSite = cookie.__dict__['_rest']['SameSite']
            builder += f'; samesite={sameSite.lower()}'
        builder += ('; secure' if cookie.__dict__['secure'] else '')
        print(builder)
    if cleanup:
        try:
            os.remove(_get_cookies_filepath(username))
        except OSError:
            pass

@click.group()
def cli():
    pass

cli.add_command(login)

if __name__ == '__main__':
  cli()