import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { UserScreenHeader } from "./userheader";
import { useUserLogic } from "./userlogic";
import { SettingsModal } from "./usersettingsmodal";
import  UserMetrics  from "./usermetricsscreen";

export default function UserScreen({ route }: any) {

  const followingId = route?.params?.followingId;

  const {
    username,
    followers,
    following,
    likes,
    followed,
    isOwnProfile,
    follow,
    unfollow,
    fetchFollowersCount,
    fetchFollowingCount,
    fetchMyEvents,
    handleShare,
    showSettings,
    openSettings,
    closeSettings,
    theme,
    toggleTheme,
    goToInactiveScreens,
    logout,
  } = useUserLogic(followingId);

  return (
    <View style={styles.container}>
      <ScrollView>

        <View style={styles.header}>
          <UserScreenHeader />
        </View>

        <View style={styles.actions}>
          <Text style={styles.username}>{username || "Loading..."}</Text>

          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.button, followed && styles.followed]}
              onPress={follow}
            >
              <Text style={styles.buttonText}>
                {followed ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.button} onPress={handleShare}>
            <Text style={styles.buttonText}>Share Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openSettings}>
            <Text style={styles.settings}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <UserMetrics
          followers={followers}
          following={following}
          likes={likes}
          onFollowersPress={fetchFollowersCount}
          onFollowingPress={fetchFollowingCount}
        />

        <View style={styles.section}>
          <TouchableOpacity style={styles.listItem} onPress={fetchMyEvents}>
            <Text style={styles.listText}>My Events</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <SettingsModal
        visible={showSettings}
        username={username}
        closeSettings={closeSettings}
        theme={theme}
        toggleTheme={toggleTheme}
        goToInactiveScreens={goToInactiveScreens}
        unfollow={unfollow}
        logout={logout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
  },
  settings: {
    fontSize: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  followed: {
    backgroundColor: "#777",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  listItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  listText: {
    fontSize: 16,
  },
});
