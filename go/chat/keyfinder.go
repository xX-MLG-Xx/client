package chat

import (
	"fmt"

	"github.com/keybase/client/go/logger"
	"github.com/keybase/client/go/protocol/keybase1"
	"golang.org/x/net/context"
)

// keyFinder remembers results from previous calls to CryptKeys().
// It is not intended to be used by multiple concurrent goroutines
// or held onto for very long, just to remember the keys while
// unboxing a thread of messages.
type KeyFinder interface {
	Find(ctx context.Context, tlf keybase1.TlfInterface, tlfName string, tlfPublic bool) (keybase1.GetTLFCryptKeysRes, error)
}

type KeyFinderImpl struct {
	keys map[string]keybase1.GetTLFCryptKeysRes
	log  logger.Logger
}

// newKeyFinder creates a keyFinder.
func NewKeyFinder(log logger.Logger) KeyFinder {
	return &KeyFinderImpl{
		keys: make(map[string]keybase1.GetTLFCryptKeysRes),
		log:  log,
	}
}

func (k *KeyFinderImpl) cacheKey(tlfName string, tlfPublic bool) string {
	return fmt.Sprintf("%s|%v", tlfName, tlfPublic)
}

// find finds keybase1.TLFCryptKeys for tlfName, checking for existing
// results.
func (k *KeyFinderImpl) Find(ctx context.Context, tlf keybase1.TlfInterface, tlfName string, tlfPublic bool) (keybase1.GetTLFCryptKeysRes, error) {
	ckey := k.cacheKey(tlfName, tlfPublic)
	existing, ok := k.keys[ckey]
	if ok {
		return existing, nil
	}

	query := keybase1.TLFQuery{
		TlfName: tlfName,
	}

	var keys keybase1.GetTLFCryptKeysRes
	if tlfPublic {
		res, err := tlf.PublicCanonicalTLFNameAndID(ctx, query)
		if err != nil {
			return keybase1.GetTLFCryptKeysRes{}, err
		}
		keys.NameIDBreaks = res
		keys.CryptKeys = []keybase1.CryptKey{publicCryptKey}
	} else {
		var err error
		keys, err = tlf.CryptKeys(ctx, query)
		if err != nil {
			return keybase1.GetTLFCryptKeysRes{}, err
		}
	}

	k.keys[ckey] = keys

	return keys, nil
}
