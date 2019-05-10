# -----------------------
# Trace out the bifurcations for a given number of
# bounces where energy starts at -1/3. When a
# bifurcation is found, trace it out using a vector
# and varying p_phi
# -----------------------

# Import needed libraries
import magphyxp
import numpy as np
# -----------------------
# Variables deciding whether
# pphi is constant or ptheta
# is constant
VARY_PTHETA_PPHI = 0
VARY_PTHETA_ENERGY = 1
# -----------------------

f = open('/home/bojohnson/Desktop/traces.txt','w') # File to write data to
bifurcation_id = 0
for num_bounces in range(1,65):
    # For each bounce number start the search
    # with the given energy value E, the given v_step
    # which is the vector step size in tracing out
    # the bifurcation, and E_step which determines the
    # step for E
    E = -1/3
    previous_E = -1 # Placeholder for now
    previous_t = -1 # Placeholder for now
    v_step = 1e-3
    E_step = 1e-7
    # ------------------------------------------------
    while (E <= 0):
        min_one = magphyxp.calculate_min(1e-9, 1e-9, num_bounces, E, 1e-7, VARY_PTHETA_ENERGY, 1e-7) # Calculate minimum
        if (min_one.f < 1e-9 and min_one.energy > -1/3 and min_one.energy - previous_E > E_step and min_one.t > 0.0 and min_one.t - previous_t > 1):
            vector = np.array((0, v_step, 0)) # Setup vector
            curr_state = np.array((min_one.ptheta, min_one.pphi, min_one.energy)) # Get the current state of pphi, ptheta, and energy
            epsilon = 1e-2 # Used in determining if the energy is increasing within some margin
            new_bifurcation = True
            while (curr_state[2] < 0):
                next_state = curr_state + vector # Follow the vector to next state
                prev_state = next_state # Save state where we came from
                if (next_state[1] > np.sqrt((next_state[2] + 1/3 - next_state[0]**2 / 2) / 5) or next_state[2] > 0 or (next_state[2] + 1/3 - next_state[0]**2 / 2) / 5 < 0): # Make sure we're on the same trace
                    break
                min_two = magphyxp.calculate_min(next_state[0], next_state[1], num_bounces, next_state[2], 1e-7, VARY_PTHETA_ENERGY, 1e-7) # Calculate new min at new location
                if min_two.f > 1e-9:
                    break
                next_state = np.array((min_two.ptheta, min_two.pphi, min_two.energy)) # New min gives new state
                vector = next_state - curr_state # Find new vector
                curr_state = next_state # Change current state to the newest one found
                if (next_state[2] < (prev_state[2] - epsilon)): # Make sure energy is increasing within some tolerance
                    break
                # Write out ID, N, pr, ptheta, pphi, energy, rocking number, in phase, period
                if new_bifurcation:
                    new_bifurcation = False
                    bifurcation_id += 1
                f.write(
                    '{} {} {:<.5f} {:<.5f} {:<.5f} {:<.5f} {} {} {:<.5f}\n'.format(
                    bifurcation_id,num_bounces, np.sqrt(abs(2*curr_state[2] + 2/3 - curr_state[0]**2 - 10*curr_state[1]**2)), curr_state[0], curr_state[1],
                    curr_state[2], int(min_one.rocking_number / 2), min_one.rocking_in_phase, min_two.t)
                )
                # f.flush()
                # Slowly increase the step size of the vector
                vector[1] *= 1.1
                vector[2] *= 1.1
                # -------------------------------------------
                epsilon *= 0.9 # Slowly decrease tolerance of energy difference
            # bifurcation_id += 1
            previous_E = min_one.energy
        E_step = E_step * 1.1
        E = E + E_step

f.close()
