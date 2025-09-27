package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

const (
	FolderName = "seekernotes"
	FileName   = "config.json"
)

// Config struct (expand with whatever fields you need)
type Config struct {
	UserSelectedDirectory string `json:"userSelectedDirectory"`
}

// GetConfig - Returns the config if it exists. If not, create a new one and return it
func GetConfig() (*Config, error) {
	configDir, err := EnsureConfigPathExists()
	if err != nil {
		return nil, err
	}

	configPath := filepath.Join(configDir, FileName)

	// if config dont exist, we create a neew one
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		defaultCfg := &Config{UserSelectedDirectory: ""}
		if err := SaveConfig(defaultCfg); err != nil {
			return nil, err
		}
		return defaultCfg, nil
	}

	// if it exists, then we read n parse it
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// SaveConfig - Overwrites config.json with new values
func SaveConfig(config *Config) error {
	configDir, err := EnsureConfigPathExists()
	if err != nil {
		return err
	}

	configPath := filepath.Join(configDir, FileName)

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

// EnsureConfigPathExists - Creates config dir if missing. Returns config directory path (not file)
func EnsureConfigPathExists() (string, error) {
	baseDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	configDir := filepath.Join(baseDir, FolderName)

	// If not exists → create it
	if _, err := os.Stat(configDir); os.IsNotExist(err) {
		if err := os.MkdirAll(configDir, os.ModePerm); err != nil {
			return "", err
		}
		return configDir, nil
	}

	// If exists but is not a dir → error
	info, err := os.Stat(configDir)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", fmt.Errorf("config path '%s' exists but is not a directory", configDir)
	}

	return configDir, nil
}

func (cfg *Config) IsUserDirValid() bool {
	if cfg.UserSelectedDirectory == "" {
		return false
	}

	if cfg.UserSelectedDirectory == "/" {
		return false
	}

	info, err := os.Stat(cfg.UserSelectedDirectory)
	if err != nil || !info.IsDir() {
		return false
	}

	return true
}
