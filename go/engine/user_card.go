// Copyright 2015 Keybase, Inc. All rights reserved. Use of
// this source code is governed by the included BSD license.

package engine

import (
	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/protocol/keybase1"
)

type card struct {
	Status        libkb.AppStatus `json:"status"`
	FollowSummary struct {
		Following int `json:"following"`
		Followers int `json:"followers"`
	} `json:"follow_summary"`
	Profile struct {
		FullName string `json:"full_name"`
		Location string `json:"location"`
		Bio      string `json:"bio"`
		Website  string `json:"website"`
		Twitter  string `json:"twitter"`
	} `json:"profile"`
	YouFollowThem bool `json:"you_follow_them"`
	TheyFollowYou bool `json:"they_follow_you"`
}

func (c *card) GetAppStatus() *libkb.AppStatus {
	return &c.Status
}

func getUserCard(g *libkb.GlobalContext, uid keybase1.UID, useSession bool) (ret *keybase1.UserCard, err error) {
	defer g.Trace("getUserCard", func() error { return err })()

	cached, err := g.CardCache.Get(uid, useSession)
	if err != nil {
		g.Log.Debug("CardCache.Get error: %s", err)
	} else if cached != nil {
		g.Log.Debug("CardCache.Get hit for %s", uid)
		return cached, nil
	}
	g.Log.Debug("CardCache.Get miss for %s", uid)

	arg := libkb.APIArg{
		Endpoint:    "user/card",
		NeedSession: useSession,
		Args:        libkb.HTTPArgs{"uid": libkb.S{Val: uid.String()}},
	}

	var card card

	if err = g.API.GetDecode(arg, &card); err != nil {
		g.Log.Warning("error getting user/card for %s: %s\n", uid, err)
		return nil, err
	}

	ret = &keybase1.UserCard{
		Following:     card.FollowSummary.Following,
		Followers:     card.FollowSummary.Followers,
		Uid:           uid,
		FullName:      card.Profile.FullName,
		Location:      card.Profile.Location,
		Bio:           card.Profile.Bio,
		Website:       card.Profile.Website,
		Twitter:       card.Profile.Twitter,
		YouFollowThem: card.YouFollowThem,
		TheyFollowYou: card.TheyFollowYou,
	}

	if err := g.CardCache.Set(ret, useSession); err != nil {
		g.Log.Debug("CardCache.Set error: %s", err)
	}

	return ret, nil
}

func displayUserCard(g *libkb.GlobalContext, iui libkb.IdentifyUI, uid keybase1.UID, useSession bool) error {
	card, err := getUserCard(g, uid, useSession)
	if err != nil {
		return err
	}
	if card == nil {
		return nil
	}

	return iui.DisplayUserCard(*card)
}

func displayUserCardAsync(g *libkb.GlobalContext, iui libkb.IdentifyUI, uid keybase1.UID, useSession bool) <-chan error {
	ch := make(chan error)
	go func() {
		ch <- displayUserCard(g, iui, uid, useSession)
	}()
	return ch
}
