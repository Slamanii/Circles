import React from 'react'
import { View, Text, Modal, TouchableOpacity, StyleSheet, Switch } from "react-native"

export function SettingsModal({
        visible,
        username,
        closeSettings,
        toggleTheme,
        theme,
        goToInactiveScreens,
        logout,
        unfollow,
 }: any) {


    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
        >

            <TouchableOpacity style={styles.overlay} onPress={closeSettings} />

            <View style={styles.container}>
                <View style={styles.handle}>

                    <Text style={styles.title}>{username}</Text>

                    <View style={styles.row}>
                        <Text style={styles.text}>
                            Dark Mode
                        </Text>
                        <Switch 
                            value={theme === "dark"}
                            onValueChange={toggleTheme}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => goToInactiveScreens("QR")}
                    >
                        <Text style={styles.text}>QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => goToInactiveScreens("privacy")}
                    >
                        <Text style={styles.text}>Privacy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => goToInactiveScreens("music")}
                    >
                        <Text style={styles.text}>Music</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => goToInactiveScreens("add-account")}
                    >
                        <Text style={styles.text}>Add Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => goToInactiveScreens("support")}
                    >
                        <Text style={styles.text}>Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => unfollow}
                    >
                        <Text style={styles.text}>Unfollow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logout} onPress={logout}>
                        <Text style={styles.text}>Logout</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  button: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  text: {
    fontSize: 16,
  },
  logout: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
});