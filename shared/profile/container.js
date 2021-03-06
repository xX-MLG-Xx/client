// @flow
import ErrorComponent from '../common-adapters/error-profile'
import Profile from './index'
import React, {PureComponent} from 'react'
import flags from '../util/feature-flags'
import {addProof, onUserClick, onClickAvatar, onClickFollowers, onClickFollowing, checkProof} from '../actions/profile'
import {connect} from 'react-redux'
import {getProfile, updateTrackers, onFollow, onUnfollow, openProofUrl} from '../actions/tracker'
import {isLoading} from '../constants/tracker'
import {isTesting} from '../local-debug'
import {openInKBFS} from '../actions/kbfs'
import {navigateAppend, navigateUp} from '../actions/route-tree'
import {profileTab} from '../constants/tabs'

import type {MissingProof} from '../common-adapters/user-proofs'
import type {Proof} from '../constants/tracker'
import type {RouteProps} from '../route-tree/render-route'
import type {Props} from './index'
import type {Tab as FriendshipsTab} from './friendships'

type OwnProps = {
  routeProps: {
    username: ?string,
    uid: ?string,
  },
} & RouteProps<{}, {currentFriendshipsTab: FriendshipsTab}>

type EitherProps<P> = {
  type: 'ok',
  okProps: P,
} | {
  type: 'error',
  propError: string,
}

type State = {
  avatarLoaded: boolean,
}

class ProfileContainer extends PureComponent<void, EitherProps<Props>, State> {
  state: State;

  constructor () {
    super()
    this.state = {avatarLoaded: false}
  }

  componentWillReceiveProps (nextProps: EitherProps<Props>) {
    if (this.props.type === 'error' || nextProps.type === 'error') {
      return
    }

    const {username} = this.props.okProps
    const {username: nextUsername} = nextProps.okProps
    if (username !== nextUsername) {
      this.setState({avatarLoaded: false})
    }
  }

  render () {
    if (this.props.type === 'error') {
      return <ErrorComponent error={this.props.propError} />
    }

    const props = this.props.okProps

    return <Profile
      {...props}
      onAvatarLoaded={() => this.setState({avatarLoaded: true})}
      followers={this.state.avatarLoaded ? props.followers : null}
      following={this.state.avatarLoaded ? props.following : null} />
  }
}

export default connect(
  (state, {routeProps, routeState, routePath}: OwnProps) => {
    const myUsername = state.config.username
    const myUid = state.config.uid
    const username = routeProps.username ? routeProps.username : myUsername
    // FIXME: we shouldn't be falling back to myUid here
    const uid = routeProps.username && routeProps.uid || myUid

    return {
      username,
      uid,
      profileIsRoot: routePath.size === 1 && routePath.first() === profileTab,
      myUsername,
      trackerState: state.tracker.trackers[username],
      currentFriendshipsTab: routeState.currentFriendshipsTab,
    }
  },
  (dispatch: any, {setRouteState}: OwnProps) => ({
    onUserClick: (username, uid) => { dispatch(onUserClick(username, uid)) },
    onBack: () => { dispatch(navigateUp()) },
    onFolderClick: folder => { dispatch(openInKBFS(folder.path)) },
    onEditProfile: () => { dispatch(navigateAppend(['editProfile'])) },
    onEditAvatar: () => { dispatch(navigateAppend(['editAvatar'])) },
    onMissingProofClick: (missingProof: MissingProof) => { dispatch(addProof(missingProof.type)) },
    onRecheckProof: (proof: Proof) => { dispatch(checkProof(proof && proof.id)) },
    onRevokeProof: (proof: Proof) => {
      dispatch(navigateAppend([{selected: 'revoke', props: {platform: proof.type, platformHandle: proof.name, proofId: proof.id}}], [profileTab]))
    },
    onViewProof: (proof: Proof) => { dispatch(openProofUrl(proof)) },
    getProfile: username => dispatch(getProfile(username)),
    updateTrackers: (username, uid) => dispatch(updateTrackers(username, uid)),
    onFollow: username => { dispatch(onFollow(username, false)) },
    onUnfollow: username => { dispatch(onUnfollow(username)) },
    onAcceptProofs: username => { dispatch(onFollow(username, false)) },
    onClickAvatar: (username, uid) => { dispatch(onClickAvatar(username, uid)) },
    onClickFollowers: (username, uid) => { dispatch(onClickFollowers(username, uid)) },
    onClickFollowing: (username, uid) => { dispatch(onClickFollowing(username, uid)) },
    onChangeFriendshipsTab: currentFriendshipsTab => { setRouteState({currentFriendshipsTab}) },
  }),
  (stateProps, dispatchProps) => {
    const {username, uid} = stateProps
    if (!uid) {
      throw new Error('Attempted to render a Profile page with no uid set')
    }

    const refresh = () => {
      dispatchProps.getProfile(username)
      dispatchProps.updateTrackers(username, uid)
    }
    const isYou = username === stateProps.myUsername
    const bioEditFns = isYou ? {
      onBioEdit: dispatchProps.onEditProfile,
      onEditAvatarClick: dispatchProps.onEditAvatar,
      onEditProfile: dispatchProps.onEditProfile,
      onLocationEdit: dispatchProps.onEditProfile,
      onNameEdit: dispatchProps.onEditProfile,
    } : null

    if (stateProps.trackerState && stateProps.trackerState.type !== 'tracker') {
      const propError = 'Expected a tracker type, trying to show profile for non user'
      console.warn(propError)
      return {type: 'error', propError}
    }

    const okProps = {
      ...stateProps.trackerState,
      ...dispatchProps,
      isYou,
      bioEditFns,
      username,
      currentFriendshipsTab: stateProps.currentFriendshipsTab,
      refresh,
      followers: stateProps.trackerState ? stateProps.trackerState.trackers : [],
      following: stateProps.trackerState ? stateProps.trackerState.tracking : [],
      loading: isLoading(stateProps.trackerState) && !isTesting,
      onBack: stateProps.profileIsRoot ? null : dispatchProps.onBack,
      onFollow: () => dispatchProps.onFollow(username),
      onUnfollow: () => dispatchProps.onUnfollow(username),
      onAcceptProofs: () => dispatchProps.onFollow(username),
      showComingSoon: !flags.tabProfileEnabled,
      onClickAvatar: () => dispatchProps.onClickAvatar(username, uid),
      onClickFollowers: () => dispatchProps.onClickFollowers(username, uid),
      onClickFollowing: () => dispatchProps.onClickFollowing(username, uid),
    }

    return {type: 'ok', okProps}
  }
)(ProfileContainer)
